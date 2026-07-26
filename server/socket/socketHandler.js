// socket/socketHandler.js — Real-time notification and comment events
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.io authentication middleware.
 * Reads JWT from handshake auth.token or cookie.
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
      ?.split(';')
      .find((c) => c.trim().startsWith('accessToken='))
      ?.split('=')[1];

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('_id username displayName avatar');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

const initSocket = (io) => {
  // Optional auth middleware — allow anonymous connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith('accessToken='))
        ?.split('=')[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.id).select('_id username displayName avatar');
        if (user) socket.user = user;
      }
    } catch { /* anonymous */ }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);
      socket.join(`user:${userId}`);
    } else {
      console.log(`🔌 Anonymous socket connected: ${socket.id}`);
    }

    // Join post room for real-time comment updates
    socket.on('joinPost', (postId) => {
      socket.join(`post:${postId}`);
    });

    socket.on('leavePost', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Typing indicator for comments (auth required)
    socket.on('typing', ({ postId }) => {
      if (!socket.user) return;
      socket.to(`post:${postId}`).emit('userTyping', {
        userId: socket.user._id.toString(),
        username: socket.user.username,
      });
    });

    socket.on('stopTyping', ({ postId }) => {
      if (!socket.user) return;
      socket.to(`post:${postId}`).emit('userStopTyping', {
        userId: socket.user._id.toString(),
      });
    });

    socket.on('disconnect', (reason) => {
      const label = socket.user?.username || 'anonymous';
      console.log(`🔌 Socket disconnected: ${label} (${reason})`);
    });
  });

  return io;
};

/**
 * Emit a notification to a specific user's socket room.
 * Called from controllers after creating a Notification document.
 */
const emitNotification = (io, recipientId, notification) => {
  io.to(`user:${recipientId.toString()}`).emit('notification', notification);
};

module.exports = { initSocket, emitNotification };
