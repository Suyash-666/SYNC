const prisma = require('../../config/db');

module.exports = function socketHandler(socket, ns){
  async function joinRoom(payload){
    const { room_id } = payload || {};
    if(!room_id) return socket.emit('error', { message: 'room_id required' });
    const room = await prisma.studyRoom.findUnique({ where: { id: room_id } });
    if(!room) return socket.emit('error', { message: 'Room not found' });
    const membership = await prisma.studyRoomMembership.findUnique({ where: { room_id_user_id: { room_id, user_id: socket.user.id } } });
    if(!membership) return socket.emit('error', { message: 'Not a member of room' });
    socket.join(room_id);
    const members = await prisma.studyRoomMembership.findMany({ where: { room_id }, include: { user: true } });
    const recent = await prisma.studyRoomMessage.findMany({ where: { room_id }, orderBy: { created_at: 'desc' }, take: 50, include: { user: true } });
    socket.emit('room_joined', { room, members, recent_messages: recent.reverse() });
    socket.to(room_id).emit('user_joined', { user: { id: socket.user.id, name: socket.user.full_name, avatar: socket.user.avatar_url } });
  }

  async function leaveRoom(payload){
    const { room_id } = payload || {};
    if(!room_id) return socket.emit('error', { message: 'room_id required' });
    socket.leave(room_id);
    socket.to(room_id).emit('user_left', { user_id: socket.user.id });
  }

  async function sendMessage(payload){
    const { room_id, content } = payload || {};
    if(!room_id || !content) return socket.emit('error', { message: 'room_id and content required' });
    if(content.length > 2000) return socket.emit('error', { message: 'Content too long' });
    // verify membership
    const membership = await prisma.studyRoomMembership.findUnique({ where: { room_id_user_id: { room_id, user_id: socket.user.id } } });
    if(!membership) return socket.emit('error', { message: 'Not a member' });
    const msg = await prisma.studyRoomMessage.create({ data: { room_id, user_id: socket.user.id, content } });
    const user = await prisma.user.findUnique({ where: { id: socket.user.id } });
    const out = { id: msg.id, room_id, content: msg.content, created_at: msg.created_at, user: { id: user.id, name: user.full_name, avatar: user.avatar_url } };
    ns.to(room_id).emit('new_message', { message: out });
  }

  function typingStart(payload){
    const { room_id } = payload || {};
    if(!room_id) return;
    socket.to(room_id).emit('typing_start', { user: { id: socket.user.id, name: socket.user.full_name } });
  }

  function typingStop(payload){
    const { room_id } = payload || {};
    if(!room_id) return;
    socket.to(room_id).emit('typing_stop', { user_id: socket.user.id });
  }

  socket.on('join_room', joinRoom);
  socket.on('leave_room', leaveRoom);
  socket.on('send_message', sendMessage);
  socket.on('typing_start', typingStart);
  socket.on('typing_stop', typingStop);
};
