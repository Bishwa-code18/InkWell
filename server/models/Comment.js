// models/Comment.js — Nested comment schema (max depth 6)
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, maxlength: 10000 },

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },

    // null = top-level comment
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0 },

    depth: { type: Number, default: 0, max: 6 },

    isDeleted: { type: Boolean, default: false },
    isRemoved: { type: Boolean, default: false }, // mod-removed
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', commentSchema);
