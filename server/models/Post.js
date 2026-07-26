// models/Post.js — Post schema with hot-sort score and text search
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, unique: true },
    body: { type: String }, // rich HTML or markdown
    excerpt: { type: String, maxlength: 500 },

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },

    tags: [{ type: String, maxlength: 30 }],
    flair: { type: String, maxlength: 50 },

    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    postType: {
      type: String,
      enum: ['text', 'link', 'image', 'video'],
      default: 'text',
    },
    linkUrl: { type: String }, // for link posts

    readTime: { type: Number, default: 1 }, // minutes

    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // upvotes - downvotes
    hotScore: { type: Number, default: 0 }, // calculated hot sort score
    voteCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    isNSFW: { type: Boolean, default: false },
    isSpoiler: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['published', 'draft', 'removed'],
      default: 'published',
    },
    isSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Text search indexes ────────────────────────────────────────────────────
postSchema.index({ title: 'text', body: 'text', tags: 'text' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ hotScore: -1 });
postSchema.index({ score: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ status: 1 });

// ── Hot sort algorithm: score / (age_hours + 2)^1.5 ───────────────────────
postSchema.methods.calculateHotScore = function () {
  const ageHours = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  this.hotScore = this.score / Math.pow(ageHours + 2, 1.5);
  return this.hotScore;
};

// ── Read time estimate (words / 200) ──────────────────────────────────────
postSchema.pre('save', function (next) {
  if (this.isModified('body') && this.body) {
    const wordCount = this.body.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Auto-generate slug from title + random suffix
  if (this.isNew && this.title) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
    this.slug = `${base}-${Date.now()}`;
  }

  // Auto-generate excerpt from body
  if (this.isModified('body') && this.body && !this.excerpt) {
    const plain = this.body.replace(/<[^>]*>/g, '').trim();
    this.excerpt = plain.slice(0, 300) + (plain.length > 300 ? '...' : '');
  }

  next();
});

module.exports = mongoose.model('Post', postSchema);
