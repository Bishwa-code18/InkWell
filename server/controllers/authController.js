// controllers/authController.js — Authentication logic
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
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

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setTokenCookies(res, accessToken, refreshToken);

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

      const user = await User.findOne({ email }).select('+passwordHash');
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

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      setTokenCookies(res, accessToken, refreshToken);

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

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
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
      await user.save();

      res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      next(err);
    }
  },
];

// ── OAuth Callback Handler ─────────────────────────────────────────────────
const oauthCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    // Redirect to frontend with token in query (client stores it)
    res.redirect(`${process.env.CLIENT_URL}/oauth/success?token=${accessToken}`);
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

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  oauthCallback,
  verifyEmail,
};
