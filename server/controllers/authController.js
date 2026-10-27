// controllers/authController.js — Authentication logic
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
  setTokenCookies,
  clearTokenCookies,
} = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ── Validation rules ───────────────────────────────────────────────────────
const registerValidation = [
  body('displayName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 50 }),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Internal helper: issue tokens + store hashed refresh token ────────────
const issueTokens = async (res, userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Store hashed refresh token in DB (max 5 sessions per user)
  const hashed = hashToken(refreshToken);
  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        $each: [hashed],
        $slice: -5, // keep only the last 5 sessions
      },
    },
  });

  setTokenCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};

// ── Internal helper: revoke one refresh token ─────────────────────────────
const revokeRefreshToken = async (userId, rawToken) => {
  if (!rawToken) return;
  const hashed = hashToken(rawToken);
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: hashed },
  });
};

// ── Register ───────────────────────────────────────────────────────────────
const register = [
  ...registerValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
      }

      const { displayName, username, email, password } = req.body;

      // Check uniqueness
      const existingUser = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] });
      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        return res.status(409).json({ message: `This ${field} is already registered.` });
      }

      const verificationToken = generateSecureToken();

      const user = await User.create({
        displayName,
        username: username.toLowerCase(),
        email,
        passwordHash: password, // hashed via pre-save hook
        verificationToken,
      });

      // Send verification email (non-blocking)
      sendVerificationEmail(email, username, verificationToken).catch(console.error);

      const { accessToken } = await issueTokens(res, user._id);

      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account.',
        user: user.toPublicJSON(),
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  },
];

// ── Login ──────────────────────────────────────────────────────────────────
const login = [
  ...loginValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been banned.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const { accessToken } = await issueTokens(res, user._id);

      res.json({
        success: true,
        user: user.toPublicJSON(),
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  },
];

// ── Logout ─────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // Revoke the current refresh token from DB
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (req.user?._id && rawRefreshToken) {
      await revokeRefreshToken(req.user._id, rawRefreshToken);
    }
  } catch {
    // Non-blocking — always clear cookies
  }
  clearTokenCookies(res);
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ── Refresh Token ──────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    // Verify JWT signature first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        clearTokenCookies(res);
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    // Verify the hashed token exists in DB (blacklist check)
    const hashed = hashToken(token);
    const user = await User.findOne({
      _id: decoded.id,
      refreshTokens: hashed,
    }).select('+refreshTokens');

    if (!user) {
      // Token replay attack detected — invalidate ALL sessions for this user
      await User.findByIdAndUpdate(decoded.id, { $set: { refreshTokens: [] } });
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Session invalid. Please log in again.' });
    }

    if (user.isBanned) {
      clearTokenCookies(res);
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    // Rotate: remove old token, issue new pair
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: hashed },
    });

    const { accessToken: newAccessToken } = await issueTokens(res, user._id);

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = [
  body('email').trim().isEmail().normalizeEmail(),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      // Always return 200 to prevent email enumeration
      if (!user) {
        return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
      }

      const token = generateSecureToken();
      user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save({ validateBeforeSave: false });

      await sendPasswordResetEmail(email, token);

      res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  },
];

// ── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      }).select('+passwordResetToken +passwordResetExpires');

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
      }

      user.passwordHash = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      // Invalidate ALL existing sessions after password reset
      user.refreshTokens = [];
      await user.save();

      clearTokenCookies(res);
      res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      next(err);
    }
  },
];

// ── OAuth Callback Handler ─────────────────────────────────────────────────
// FIX: Token is set as httpOnly cookie — NOT exposed in URL query string.
const oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    await issueTokens(res, user._id);

    // Redirect to frontend — no token in URL (client calls /api/users/me after redirect)
    res.redirect(`${process.env.CLIENT_URL}/oauth/success`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

// ── Verify Email ───────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── Get current authenticated user (used after OAuth redirect) ────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  oauthCallback,
  verifyEmail,
  getMe,
};
