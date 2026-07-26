// controllers/moderationController.js — Admin/Mod actions for reports and bans
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// ── GET /api/moderation/reports — List all reports (pending first) ────────
const getReports = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('reporter', 'username displayName avatar')
      .populate({
        path: 'target',
        populate: { path: 'author', select: 'username displayName avatar' }
      })
      .lean();

    const total = await Report.countDocuments({ status });
    res.json({ success: true, reports, total });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/moderation/reports — Submit a report ────────────────────────
const createReport = async (req, res, next) => {
  try {
    const { targetId, targetModel, reason, description } = req.body;
    if (!targetId || !targetModel || !reason) {
      return res.status(400).json({ message: 'Missing report data.' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      target: targetId,
      targetModel,
      reason,
      description
    });

    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/moderation/reports/:id/resolve — Resolve a report ─────────────
const resolveReport = async (req, res, next) => {
  try {
    const { status, action } = req.body; // status: reviewed/resolved, action: delete/ban/ignore
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (action === 'delete') {
      if (report.targetModel === 'Post') {
        await Post.findByIdAndUpdate(report.target, { status: 'removed' });
      } else if (report.targetModel === 'Comment') {
        await Comment.findByIdAndUpdate(report.target, { isDeleted: true });
      }
    } else if (action === 'ban') {
      // Find the author of the target
      let targetUser;
      if (report.targetModel === 'Post') {
        const p = await Post.findById(report.target);
        targetUser = p?.author;
      } else if (report.targetModel === 'Comment') {
        const c = await Comment.findById(report.target);
        targetUser = c?.author;
      } else {
        targetUser = report.target;
      }

      if (targetUser) {
        if (targetUser.toString() === req.user._id.toString()) {
          return res.status(400).json({ message: 'You cannot ban yourself.' });
        }
        const userToBan = await User.findById(targetUser);
        if (userToBan) {
          if (req.user.role !== 'admin' && (userToBan.role === 'admin' || userToBan.role === 'moderator')) {
            return res.status(403).json({ message: 'Moderators cannot ban other moderators or administrators.' });
          }
          userToBan.isBanned = true;
          await userToBan.save();
        }
      }
    }

    report.status = status || 'resolved';
    await report.save();

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/moderation/users/:id — Update user role or ban status ─────────
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isBanned } = req.body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Role check: Only admins can change roles.
    if (role !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only administrators can change user roles.' });
      }
      userToUpdate.role = role;
    }

    // Ban check: Mods and admins can ban/unban.
    if (isBanned !== undefined) {
      // Prevent self-banning
      if (id === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot ban yourself.' });
      }
      // Prevent banning admins or other mods by mods (only admins can ban mods/admins)
      if (req.user.role !== 'admin' && (userToUpdate.role === 'admin' || userToUpdate.role === 'moderator')) {
        return res.status(403).json({ message: 'Moderators cannot ban other moderators or administrators.' });
      }
      userToUpdate.isBanned = isBanned;
    }

    await userToUpdate.save();
    res.json({ success: true, user: userToUpdate.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/moderation/stats — Dashboard stats ────────────────────────────
const getModStats = async (req, res, next) => {
  try {
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalPosts = await Post.countDocuments();

    res.json({
      success: true,
      stats: {
        pendingReports,
        totalUsers,
        bannedUsers,
        totalPosts
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  createReport,
  resolveReport,
  updateUser,
  getModStats
};
