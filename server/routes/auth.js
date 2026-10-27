// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
  register, login, logout, refreshToken,
  forgotPassword, resetPassword, oauthCallback, verifyEmail, getMe,
} = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Standard auth
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', optionalAuth, logout);     // optionalAuth so we can revoke the token
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.get('/verify-email', verifyEmail);

// Called by client after OAuth redirect to get the user object
router.get('/me', protect, getMe);

// Google OAuth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'skip') {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_not_configured&provider=Google`);
  }
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  oauthCallback
);

// GitHub OAuth
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID === 'skip') {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_not_configured&provider=GitHub`);
  }
  next();
}, passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=github_failed` }),
  oauthCallback
);

module.exports = router;
