// utils/generateToken.js — JWT access & refresh token generation
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate a short-lived JWT access token (15 minutes).
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Generate a long-lived JWT refresh token (7 days).
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Generate a secure random token for password reset / email verification.
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a refresh token before storing in DB (SHA-256).
 * Raw token goes in the cookie; hashed token is stored in the DB.
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Set tokens as httpOnly cookies on the response.
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh-token', // restrict refresh token cookie path
  });
};

const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth/refresh-token' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
  setTokenCookies,
  clearTokenCookies,
};
