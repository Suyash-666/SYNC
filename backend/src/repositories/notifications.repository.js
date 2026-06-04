const prisma = require('../config/db');

async function createNotification(userId, type, title, body){
  return prisma.notification.create({ data: { user_id: userId, type, title, body } });
}

async function listNotifications(userId, filters = {}, skip = 0, take = 20){
  const where = { user_id: userId };
  if(filters.type) where.type = filters.type;
  if(typeof filters.is_read !== 'undefined') where.is_read = filters.is_read;
  const total = await prisma.notification.count({ where });
  const data = await prisma.notification.findMany({ where, skip, take, orderBy: { created_at: 'desc' } });
  return { data, total };
}

async function markRead(userId, id){
  return prisma.notification.updateMany({ where: { id, user_id: userId }, data: { is_read: true } });
}

async function markAllRead(userId){
  return prisma.notification.updateMany({ where: { user_id: userId }, data: { is_read: true } });
}

async function remove(userId, id){
  return prisma.notification.deleteMany({ where: { id, user_id: userId } });
}

module.exports = { createNotification, listNotifications, markRead, markAllRead, remove };
