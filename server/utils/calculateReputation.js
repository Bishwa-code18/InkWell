// utils/calculateReputation.js — Reputation scoring helpers
const User = require('../models/User');

/**
 * Adjust a user's reputation score.
 * +10 per upvote received, -2 per downvote.
 */
const adjustReputation = async (userId, delta) => {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { reputation: delta } });
  } catch (err) {
    console.error('Reputation update error:', err.message);
  }
};

/**
 * Format reputation number: 18500 → "18.5k"
 */
const formatReputation = (rep) => {
  if (rep >= 1000000) return `${(rep / 1000000).toFixed(1)}M`;
  if (rep >= 1000) return `${(rep / 1000).toFixed(1)}k`;
  return String(rep);
};

/**
 * Check and award achievements after an action.
 */
const checkAchievements = async (userId, trigger) => {
  const Achievement = require('../models/Achievement');
  const Post = require('../models/Post');

  try {
    const existing = await Achievement.find({ user: userId }).select('type');
    const earned = new Set(existing.map((a) => a.type));

    const toAward = [];

    if (trigger === 'firstPost' && !earned.has('firstPost')) {
      const postCount = await Post.countDocuments({ author: userId, status: 'published' });
      if (postCount >= 1) toAward.push('firstPost');
    }

    if (trigger === 'popularPost' && !earned.has('popularPost')) {
      const popular = await Post.findOne({ author: userId, score: { $gte: 100 } });
      if (popular) toAward.push('popularPost');
    }

    if (trigger === 'reputation' && !earned.has('topContributor')) {
      const user = await User.findById(userId).select('reputation');
      if (user?.reputation >= 1000) toAward.push('topContributor');
    }

    // Award each new achievement
    for (const type of toAward) {
      await Achievement.create({ user: userId, type });
      await User.findByIdAndUpdate(userId, {
        $push: { achievements: { type, earnedAt: new Date() } },
      });
    }

    return toAward;
  } catch (err) {
    console.error('Achievement check error:', err.message);
    return [];
  }
};

module.exports = { adjustReputation, formatReputation, checkAchievements };
