let socketServer = null;

const setSocketServer = (io) => {
  socketServer = io;
};

const emitNotificationCreated = (userId) => {
  if (!socketServer || !userId) return;
  socketServer.to(`notifications:${userId}`).emit('notification-created');
};

module.exports = { setSocketServer, emitNotificationCreated };
