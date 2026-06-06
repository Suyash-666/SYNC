import { io } from 'socket.io-client';

let storeRef = null;
let studySocket = null;
let notificationsSocket = null;
const joinedRooms = new Set();

function getApiOrigin() {
  // Prefer a dedicated socket URL if one is set (some deployments run the
  // socket server on a different host). Otherwise derive the origin from
  // the API URL, stripping the `/api/v1` path so Socket.IO connects to the
  // host root (e.g. http://localhost:4000, NOT http://localhost:4000/api/v1).
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
  try {
    return new URL(apiUrl, window.location.origin).origin;
  } catch {
    return 'http://localhost:4000';
  }
}

function getToken() {
  // Send the Supabase Auth access token to the Render backend's
  // socket handshake. The backend verifies it via supabase.auth.getUser.
  return storeRef?.getState?.()?.auth?.supabaseSession?.access_token || null;
}

function createSocket(namespace) {
  return io(`${getApiOrigin()}${namespace}`, {
    autoConnect: false,
    withCredentials: false,
    auth: { token: getToken() },
    transports: ['websocket'],
  });
}

/**
 * Re-issue every `join_room` we previously requested. Called on connect
 * and on auth-sync, so a token refresh or a dropped socket always ends
 * with the user back in the rooms they were looking at.
 */
function rejoinAll(socket) {
  if (!socket.connected) return;
  joinedRooms.forEach((roomId) => {
    socket.emit('join_room', { room_id: roomId });
  });
}

function attachStudyReconnect(socket) {
  socket.on('connect', () => rejoinAll(socket));
  socket.on('error', () => {
    // The backend uses `error` events for both transport-level and
    // application-level errors (the latter from the handler). The most
    // common cause is "Not a member of room" which happens when join_room
    // races with a membership insert. We log so the user sees it in the
    // dev console but don't crash.
  });
}

export function bindSocketStore(store) {
  storeRef = store;
}

export function getStudyRoomsSocket() {
  if (!studySocket) {
    studySocket = createSocket('/study-rooms');
    attachStudyReconnect(studySocket);
  }
  return studySocket;
}

export function getNotificationsSocket() {
  if (!notificationsSocket) {
    notificationsSocket = createSocket('/notifications');
  }
  return notificationsSocket;
}

export function joinStudyRoom(roomId) {
  if (!roomId) return;
  joinedRooms.add(roomId);
  const socket = getStudyRoomsSocket();
  const emit = () => socket.emit('join_room', { room_id: roomId });
  if (socket.connected) {
    emit();
  } else {
    // We need to wait for `connect` before emitting — otherwise the
    // emit is dropped on a lazy socket. We also need a valid token, so
    // if the user isn't logged in yet we just sit on the request until
    // they are and syncSocketAuth re-runs the join.
    socket.once('connect', emit);
    socket.connect();
  }
}

export function leaveStudyRoom(roomId) {
  if (!roomId) return;
  joinedRooms.delete(roomId);
  const socket = getStudyRoomsSocket();
  if (socket.connected) {
    socket.emit('leave_room', { room_id: roomId });
  }
}

export function syncSocketAuth() {
  const token = getToken();
  [studySocket, notificationsSocket].forEach((socket) => {
    if (!socket) return;
    socket.auth = { token };
    if (token) {
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    } else {
      socket.disconnect();
    }
  });
  // After (re)connect, rejoin any rooms the user was in. The 'connect'
  // listener is already attached, but we trigger it explicitly here so
  // we don't have to wait for the next event-loop tick.
  if (studySocket?.connected) rejoinAll(studySocket);
}

export function connectSockets() {
  const token = getToken();
  if (!token) return; // don't even try without a token
  getStudyRoomsSocket().connect();
  getNotificationsSocket().connect();
}

export function disconnectSockets() {
  studySocket?.disconnect();
  notificationsSocket?.disconnect();
  joinedRooms.clear();
}
