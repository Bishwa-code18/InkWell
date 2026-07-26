// controllers/usersController.js — User profile, follow, settings
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');

// ── GET /api/users/me ──────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

// ── PUT /api/users/me — Update profile ────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['displayName', 'bio', 'location', 'website', 'institution', 'interests', 'avatar', 'coverImage'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/me/password ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user.passwordHash) {
      return res.status(400).json({ message: 'No password set (OAuth account).' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword; // pre-save hook will hash
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/users/me ───────────────────────────────────────────────────
const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:username ───────────────────────────────────────────────
const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-passwordHash -refreshTokens -verificationToken -passwordResetToken -passwordResetExpires -oauthProviders');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    let isFollowing = false;
    if (req.user) {
      isFollowing = user.followers.some((f) => f.toString() === req.user._id.toString());
    }

    res.json({ success: true, user: user.toPublicJSON(), isFollowing });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/users/:username/follow — Toggle follow/unfollow ─────────────
const followUser = async (req, res, next) => {
  try {
    const target = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'User not found.' });

    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const isFollowing = target.followers.some((f) => f.toString() === req.user._id.toString());

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(target._id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: target._id } });
      return res.json({ success: true, following: false, followerCount: target.followers.length - 1 });
    }

    // Follow
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: target._id } });

    // Send notification
    Notification.create({
      recipient: target._id,
      sender: req.user._id,
      type: 'follow',
      message: `${req.user.displayName || req.user.username} started following you.`,
    }).catch(console.error);

    res.json({ success: true, following: true, followerCount: target.followers.length + 1 });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:username/posts ────────────────────────────────────────
const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const posts = await Post.find({ author: user._id, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'username displayName avatar')
      .populate('community', 'name displayName color slug')
      .lean();

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:username/comments ─────────────────────────────────────
const getUserComments = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const comments = await Comment.find({ author: user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'username displayName avatar')
      .populate('post', 'title slug')
      .lean();

    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:username/saved ────────────────────────────────────────
const getUserSaved = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'post',
        populate: [
          { path: 'author', select: 'username displayName avatar' },
          { path: 'community', select: 'name displayName color slug' },
        ],
      })
      .lean();

    const posts = bookmarks.map((b) => b.post).filter(Boolean);
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:username/achievements ─────────────────────────────────
const getUserAchievements = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ success: true, achievements: user.achievements });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/me/settings — Update user settings ─────────────────────
const updateSettings = async (req, res, next) => {
  try {
    const { darkMode, contentDensity, adultContent, filteredKeywords, emailNotifications } = req.body;

    const updates = {};
    if (darkMode !== undefined) updates['settings.darkMode'] = darkMode;
    if (contentDensity) updates['settings.contentDensity'] = contentDensity;
    if (adultContent !== undefined) updates['settings.adultContent'] = adultContent;
    if (filteredKeywords) updates['settings.filteredKeywords'] = filteredKeywords;
    if (emailNotifications) {
      if (emailNotifications.weeklyDigest !== undefined)
        updates['settings.emailNotifications.weeklyDigest'] = emailNotifications.weeklyDigest;
      if (emailNotifications.newFollower !== undefined)
        updates['settings.emailNotifications.newFollower'] = emailNotifications.newFollower;
      if (emailNotifications.securityUpdates !== undefined)
        updates['settings.emailNotifications.securityUpdates'] = emailNotifications.securityUpdates;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, settings: user.settings });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  getUser,
  followUser,
  getUserPosts,
  getUserComments,
  getUserSaved,
  getUserAchievements,
  updateSettings,
};
