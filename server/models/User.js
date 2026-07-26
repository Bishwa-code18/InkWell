// models/User.js — User schema with full settings, OAuth, achievements
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      select: false, // never returned by default
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: { type: String, maxlength: 500 },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    location: { type: String, maxlength: 100 },
    website: { type: String, maxlength: 200 },
    institution: { type: String, maxlength: 100 },
    interests: [{ type: String, maxlength: 50 }],

    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },

    reputation: { type: Number, default: 0 },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    achievements: [
      {
        type: {
          type: String,
          enum: ['firstPost', 'popularPost', 'topContributor', 'veteran', 'explorer'],
        },
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    settings: {
      darkMode: { type: Boolean, default: false },
      contentDensity: {
        type: String,
        enum: ['classy', 'compact', 'gallery'],
        default: 'classy',
      },
      adultContent: { type: Boolean, default: false },
      filteredKeywords: [{ type: String }],
      emailNotifications: {
        weeklyDigest: { type: Boolean, default: true },
        newFollower: { type: Boolean, default: false },
        securityUpdates: { type: Boolean, default: true },
      },
    },

    oauthProviders: [
      {
        provider: { type: String, enum: ['google', 'github'] },
        providerId: { type: String },
      },
    ],

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    isBanned: { type: Boolean, default: false },
    refreshTokens: [{ type: String, select: false }], // store hashed refresh tokens
    lastActive: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
    isSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// NOTE: username and email have unique:true which already creates indexes.
// Only add non-unique indexes here to avoid duplicate warnings.
userSchema.index({ reputation: -1 });
userSchema.index({ displayName: 'text', bio: 'text' }); // full-text search

// ── Password hashing middleware ────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

// ── Instance methods ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    coverImage: this.coverImage,
    bio: this.bio,
    location: this.location,
    website: this.website,
    institution: this.institution,
    interests: this.interests,
    role: this.role,
    reputation: this.reputation,
    followers: this.followers,
    following: this.following,
    achievements: this.achievements,
    settings: this.settings,
    isVerified: this.isVerified,
    joinedAt: this.joinedAt,
    lastActive: this.lastActive,
  };
};

module.exports = mongoose.model('User', userSchema);
