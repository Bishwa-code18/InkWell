// models/Community.js — Community schema
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Community name can only contain letters, numbers, and underscores'],
    },
    slug: { type: String, unique: true, lowercase: true },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, maxlength: 300 },
    longDescription: { type: String, maxlength: 5000 },

    rules: [
      {
        title: { type: String, maxlength: 100 },
        body: { type: String, maxlength: 500 },
      },
    ],

    avatar: { type: String, default: '' },
    banner: { type: String, default: '' },
    color: { type: String, default: '#1A6B47' }, // accent color for sidebar dot

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },

    type: {
      type: String,
      enum: ['public', 'restricted', 'private'],
      default: 'public',
    },

    topics: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    settings: {
      allowImages: { type: Boolean, default: true },
      allowLinks: { type: Boolean, default: true },
      postApproval: { type: Boolean, default: false },
    },
    isSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// NOTE: name and slug have unique:true so indexes are auto-created.
communitySchema.index({ memberCount: -1 });
communitySchema.index({ isFeatured: 1 });
communitySchema.index({ displayName: 'text', description: 'text', topics: 'text' });

// Pre-save: auto-set slug from name
communitySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name;
  }
  next();
});

module.exports = mongoose.model('Community', communitySchema);
