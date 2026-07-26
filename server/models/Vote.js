// models/Vote.js — Vote record (post or comment)
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
    targetModel: { type: String, enum: ['Post', 'Comment'], required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true }
);

// Compound unique index — one vote per user per target
voteSchema.index({ user: 1, target: 1, targetModel: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
