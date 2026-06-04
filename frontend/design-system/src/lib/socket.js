import { io } from 'socket.io-client';

let storeRef = null;
let studySocket = null;
let notificationsSocket = null;
const joinedRooms = new Set();

function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  try {
    return new URL(apiUrl, window.location.origin).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function getToken() {
  return storeRef?.getState?.()?.auth?.accessToken || null;
}

function createSocket(namespace) {
  return io(`${getApiOrigin()}${namespace}`, {
    autoConnect: false,
    withCredentials: true,
    auth: { token: getToken() },
    transports: ['websocket'],
  });
}

function attachStudyReconnect(socket) {
  socket.on('connect', () => {
    joinedRooms.forEach((roomId) => {
      socket.emit('join_room', { room_id: roomId });
    });
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
  if (!socket.connected) socket.connect();
  socket.emit('join_room', { room_id: roomId });
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
    if (socket.connected) {
      socket.disconnect().connect();
    }
  });
}

export function connectSockets() {
  getStudyRoomsSocket().connect();
  getNotificationsSocket().connect();
}

export function disconnectSockets() {
  studySocket?.disconnect();
  notificationsSocket?.disconnect();
}
