// middleware/authMiddleware.js — JWT verification middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — requires a valid access token.
 * Reads token from Authorization header OR accessToken cookie.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to httpOnly cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    // Update last active (fire-and-forget)
    User.findByIdAndUpdate(user._id, { lastActive: new Date() }).catch(() => {});

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * optionalAuth — attaches user if token is present but doesn't require it.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies?.accessToken) token = req.cookies.accessToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');
      if (user && !user.isBanned) req.user = user;
    }
  } catch {
    // ignore token errors for optional auth
  }
  next();
};

/**
 * requireRole — authorize specific roles.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, requireRole };
