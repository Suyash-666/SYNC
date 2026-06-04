const NotifRepo = require('../repositories/notifications.repository');
const { getIo } = require('../sockets');

async function create(userId, type, title, body){
  const n = await NotifRepo.createNotification(userId, type, title, body);
  const io = getIo();
  if(io){
    const ns = io.of('/notifications');
    ns.to(`user_${userId}`).emit('new_notification', n);
  }
  return n;
}

async function list(userId, filters, { skip=0, take=20 } = {}){
  return NotifRepo.listNotifications(userId, filters, skip, take);
}

async function markRead(userId, id){
  return NotifRepo.markRead(userId, id);
}

async function markAllRead(userId){
  return NotifRepo.markAllRead(userId);
}

async function remove(userId, id){
  return NotifRepo.remove(userId, id);
}

module.exports = { create, list, markRead, markAllRead, remove };
