// ============================================================================
// backend/src/sockets/handlers/studyRoom.handler.js
// Migrated in Checkpoint 6 to read/write Supabase via the service-role
// helper (src/lib/studyRoomService.js). The wire protocol and event names
// are unchanged.  Auth still verifies the legacy JWT (see auth.socket.js).
// ============================================================================

const svc = require('../../lib/studyRoomService');

module.exports = function socketHandler(socket, ns) {
  async function joinRoom(payload) {
    const { room_id } = payload || {};
    if (!room_id) return socket.emit('error', { message: 'room_id required' });

    const room = await svc.findRoom(room_id);
    if (!room) return socket.emit('error', { message: 'Room not found' });

    const membership = await svc.findMembership(room_id, socket.user.id);
    if (!membership) return socket.emit('error', { message: 'Not a member of room' });

    socket.join(room_id);
    const [members, recent] = await Promise.all([
      svc.listMembers(room_id),
      svc.listRecentMessages(room_id, 50),
    ]);
    socket.emit('room_joined', { room, members, recent_messages: recent });
    // Tell other members so they can refresh their member list. The new
    // joiner's profile is included so the recipient can render them
    // immediately without a follow-up fetch.
    socket.to(room_id).emit('user_joined', {
      user: {
        id: socket.user.id,
        full_name: socket.user.full_name,
        avatar_url: socket.user.avatar_url,
      },
    });
  }

  async function leaveRoom(payload) {
    const { room_id } = payload || {};
    if (!room_id) return socket.emit('error', { message: 'room_id required' });
    socket.leave(room_id);
    socket.to(room_id).emit('user_left', { user_id: socket.user.id });
  }

  async function sendMessage(payload) {
    const { room_id, content } = payload || {};
    if (!room_id || !content) return socket.emit('error', { message: 'room_id and content required' });
    if (content.length > 2000) return socket.emit('error', { message: 'Content too long' });

    const membership = await svc.findMembership(room_id, socket.user.id);
    if (!membership) return socket.emit('error', { message: 'Not a member' });

    const msg = await svc.insertMessage(room_id, socket.user.id, content);
    const out = {
      id: msg.id,
      room_id,
      content: msg.content,
      created_at: msg.created_at,
      user: msg.user
        ? { id: msg.user.id, full_name: msg.user.full_name, avatar_url: msg.user.avatar_url }
        : { id: socket.user.id, full_name: socket.user.full_name, avatar_url: socket.user.avatar_url },
    };
    // Broadcast to everyone in the room, INCLUDING the sender. The
    // sender's optimistic UI will dedupe by id.
    ns.to(room_id).emit('new_message', { message: out });
  }

  function typingStart(payload) {
    const { room_id } = payload || {};
    if (!room_id) return;
    socket.to(room_id).emit('typing_start', {
      user: { id: socket.user.id, full_name: socket.user.full_name },
    });
  }

  function typingStop(payload) {
    const { room_id } = payload || {};
    if (!room_id) return;
    socket.to(room_id).emit('typing_stop', { user_id: socket.user.id });
  }

  socket.on('join_room', joinRoom);
  socket.on('leave_room', leaveRoom);
  socket.on('send_message', sendMessage);
  socket.on('typing_start', typingStart);
  socket.on('typing_stop', typingStop);
};
