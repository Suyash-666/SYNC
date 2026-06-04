const { Server } = require('socket.io');
const authSocket = require('./auth.socket');
const studyRoomHandler = require('./handlers/studyRoom.handler');
const notificationHandler = require('./handlers/notification.handler');

let ioInstance = null;
const activeCounts = new Map();

function initSockets(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  ioInstance = io;

  // Study rooms namespace
  const studyNs = io.of('/study-rooms');

  studyNs.use(authSocket);

  studyNs.on('connection', (socket) => {
    const userId = socket.user?.id;

    if (userId) {
      const prev = activeCounts.get(userId) || 0;
      activeCounts.set(userId, prev + 1);

      if (prev === 0) {
        studyNs.emit('user_online', { userId });
      }
    }

    studyRoomHandler(socket, studyNs);

    socket.on('disconnect', () => {
      if (userId) {
        const cnt = (activeCounts.get(userId) || 1) - 1;

        if (cnt <= 0) {
          activeCounts.delete(userId);
          studyNs.emit('user_offline', { userId });
        } else {
          activeCounts.set(userId, cnt);
        }
      }
    });
  });

  // Notifications namespace
  const notifNs = io.of('/notifications');

  notifNs.use(authSocket);

  notifNs.on('connection', (socket) => {
    notificationHandler(socket, notifNs);
  });

  return io;
}

function getIo() {
  return ioInstance;
}

module.exports = { initSockets, getIo };