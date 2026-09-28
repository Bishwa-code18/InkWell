// server.js — Express + Socket.io app entry point
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('./config/passport');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const communitiesRoutes = require('./routes/communities');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/upload');
const moderationRoutes = require('./routes/moderation');

const app = express();
const server = http.createServer(app);

// ── Socket.io setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);
app.set('io', io); // make io accessible in controllers

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow loading external images
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize()); // required for OAuth strategies
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Apply general rate limiter to all routes
app.use('/api', generalLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/posts/:postId/comments', commentsRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/moderation', moderationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`
🚀 INKWELL Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📡 API: http://localhost:${PORT}/api
🔌 Socket.io: enabled
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use. Kill it with: npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

// ── Graceful shutdown (required for nodemon restarts) ──────────────────────
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
  // Force-exit if close takes longer than 3s
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGTERM', shutdown);   // nodemon restart signal
process.on('SIGUSR2', shutdown);   // nodemon also sends SIGUSR2
process.on('SIGINT', shutdown);    // Ctrl+C

// ── Safety nets ────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled Promise Rejection:', reason);
  // Give the server a moment to finish in-flight requests, then exit
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 3000).unref();
});

process.on('uncaughtException', (err) => {
  console.error('\n💥 Uncaught Exception:', err);
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 3000).unref();
});

startServer();

module.exports = { app, server };
