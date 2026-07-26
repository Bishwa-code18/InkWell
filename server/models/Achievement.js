// models/Achievement.js
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['firstPost', 'popularPost', 'topContributor', 'veteran', 'explorer'],
      required: true,
    },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

achievementSchema.index({ user: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
