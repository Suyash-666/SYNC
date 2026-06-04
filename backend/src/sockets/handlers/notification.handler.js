const prisma = require('../../config/db');
const { getIo } = require('../index');

module.exports = function notifHandler(socket, ns){
  const userId = socket.user.id;
  // join personal room
  socket.join(`user_${userId}`);

  socket.on('mark_read', async (payload)=>{
    const { notification_id } = payload || {};
    if(!notification_id) return socket.emit('error', { message: 'notification_id required' });
    await prisma.notification.updateMany({ where: { id: notification_id, user_id: userId }, data: { is_read: true } });
    ns.to(`user_${userId}`).emit('notification_read', { notification_id });
  });
};
