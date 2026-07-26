// controllers/commentsController.js — Nested comments with voting
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Notification = require('../models/Notification');
const { adjustReputation } = require('../utils/calculateReputation');

// ── GET /api/posts/:postId/comments ───────────────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Fetch all non-removed comments for the post
    const allComments = await Comment.find({ post: postId, isRemoved: false })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar reputation')
      .lean();

    // Attach user votes if authenticated
    if (req.user) {
      const commentIds = allComments.map((c) => c._id);
      const userVotes = await Vote.find({
        user: req.user._id,
        target: { $in: commentIds },
        targetModel: 'Comment',
      }).lean();

      const voteMap = {};
      userVotes.forEach((v) => { voteMap[v.target.toString()] = v.value; });
      allComments.forEach((c) => {
        c.userVote = voteMap[c._id.toString()] || 0;
        if (c.isDeleted) {
          c.body = '[deleted]';
          c.author = null;
        }
      });
    }

    // Build tree structure
    const commentMap = {};
    const roots = [];

    allComments.forEach((c) => {
      commentMap[c._id.toString()] = { ...c, children: [] };
    });

    allComments.forEach((c) => {
      if (c.parent) {
        const parentNode = commentMap[c.parent.toString()];
        if (parentNode) parentNode.children.push(commentMap[c._id.toString()]);
      } else {
        roots.push(commentMap[c._id.toString()]);
      }
    });

    res.json({ success: true, comments: roots });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/posts/:postId/comments ─────────────────────────────────────
const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { body, parentId } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ message: 'Comment body is required.' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    let depth = 0;
    if (parentId) {
      const parent = await Comment.findById(parentId);
      if (!parent) return res.status(404).json({ message: 'Parent comment not found.' });
      if (parent.depth >= 6) {
        return res.status(400).json({ message: 'Maximum comment depth reached.' });
      }
      depth = parent.depth + 1;

      // Add to parent's children array
      await Comment.findByIdAndUpdate(parentId, { $push: { children: null } }); // placeholder
    }

    const comment = await Comment.create({
      body: body.trim(),
      author: req.user._id,
      post: postId,
      parent: parentId || null,
      depth,
    });

    // Update parent children reference
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, {
        $push: { children: comment._id },
      });
    }

    // Increment post comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    await comment.populate('author', 'username displayName avatar reputation');

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: postId,
        comment: comment._id,
        message: `${req.user.displayName || req.user.username} commented on your post.`,
      }).catch(console.error);
    }

    // Notify parent comment author (if reply)
    if (parentId) {
      const parentComment = await Comment.findById(parentId).select('author');
      if (parentComment && parentComment.author.toString() !== req.user._id.toString()) {
        Notification.create({
          recipient: parentComment.author,
          sender: req.user._id,
          type: 'comment',
          post: postId,
          comment: comment._id,
          message: `${req.user.displayName || req.user.username} replied to your comment.`,
        }).catch(console.error);
      }
    }

    // Emit via socket (handled in socketHandler via global io)
    const io = req.app.get('io');
    if (io) {
      io.to(`post:${postId}`).emit('newComment', {
        comment: { ...comment.toObject(), children: [] },
        postId,
      });
    }

    res.status(201).json({ success: true, comment: { ...comment.toObject(), children: [] } });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/posts/:postId/comments/:id ───────────────────────────────────
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    comment.body = req.body.body?.trim() || comment.body;
    await comment.save();
    await comment.populate('author', 'username displayName avatar');

    res.json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/posts/:postId/comments/:id ───────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isOwner && !isMod) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (isOwner) {
      // Soft delete — show "[deleted]"
      comment.isDeleted = true;
      comment.body = '[deleted]';
      await comment.save();
    } else {
      // Moderator hard-remove
      comment.isRemoved = true;
      await comment.save();
    }

    // Decrement post comment count
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/posts/:postId/comments/:id/vote ─────────────────────────────
const voteComment = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (![1, -1].includes(Number(value))) {
      return res.status(400).json({ message: 'Vote value must be 1 or -1.' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    const existingVote = await Vote.findOne({
      user: req.user._id,
      target: comment._id,
      targetModel: 'Comment',
    });

    let repDelta = 0;

    if (existingVote) {
      if (existingVote.value === Number(value)) {
        await existingVote.deleteOne();
        if (value === 1) { comment.upvotes = Math.max(0, comment.upvotes - 1); repDelta = -10; }
        else { comment.downvotes = Math.max(0, comment.downvotes - 1); repDelta = 2; }
      } else {
        existingVote.value = Number(value);
        await existingVote.save();
        if (existingVote.value === 1) {
          comment.downvotes = Math.max(0, comment.downvotes - 1);
          comment.upvotes += 1;
          repDelta = 12;
        } else {
          comment.upvotes = Math.max(0, comment.upvotes - 1);
          comment.downvotes += 1;
          repDelta = -12;
        }
      }
    } else {
      await Vote.create({ user: req.user._id, target: comment._id, targetModel: 'Comment', value: Number(value) });
      if (value === 1) { comment.upvotes += 1; repDelta = 10; }
      else { comment.downvotes += 1; repDelta = -2; }
    }

    comment.score = comment.upvotes - comment.downvotes;
    await comment.save();

    if (repDelta !== 0 && comment.author.toString() !== req.user._id.toString()) {
      adjustReputation(comment.author, repDelta).catch(console.error);
    }

    res.json({ success: true, score: comment.score, upvotes: comment.upvotes, downvotes: comment.downvotes });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment, voteComment };
