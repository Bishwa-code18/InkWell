// middleware/rateLimiter.js — Rate limiting configurations
const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter: 100 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

/**
 * Strict auth rate limiter: 5 requests per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait before trying again.' },
  skipSuccessfulRequests: true,
});

/**
 * Upload rate limiter: 20 uploads per hour.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Upload limit reached. Try again in an hour.' },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter };
