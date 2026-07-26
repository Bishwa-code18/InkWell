// controllers/postsController.js — Full CRUD for posts + voting + bookmarks
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const Bookmark = require('../models/Bookmark');
const Community = require('../models/Community');
const Notification = require('../models/Notification');
const { adjustReputation, checkAchievements } = require('../utils/calculateReputation');
const { getCache, setCache, delCache } = require('../config/redis');

// ── GET /api/posts — Feed with sort options ────────────────────────────────
const getPosts = async (req, res, next) => {
  try {
    const { sort = 'hot', community, cursor, limit = 10 } = req.query;
    const pageSize = Math.min(parseInt(limit), 20);

    const filter = { status: 'published' };
    if (community) filter.community = community;

    // Cursor-based pagination
    if (cursor) {
      const cursorPost = await Post.findById(cursor).select('createdAt hotScore score');
      if (cursorPost) {
        if (sort === 'new') filter.createdAt = { $lt: cursorPost.createdAt };
        else if (sort === 'hot') filter.hotScore = { $lt: cursorPost.hotScore };
        else if (sort === 'top') filter.score = { $lte: cursorPost.score };
      }
    }

    const sortMap = {
      hot: { hotScore: -1 },
      new: { createdAt: -1 },
      top: { score: -1 },
      rising: { voteCount: -1, createdAt: -1 },
    };

    const posts = await Post.find(filter)
      .sort(sortMap[sort] || { hotScore: -1 })
      .limit(pageSize + 1) // fetch one extra to check if there's a next page
      .populate('author', 'username displayName avatar')
      .populate('community', 'name displayName avatar color slug')
      .lean();

    const hasMore = posts.length > pageSize;
    const results = hasMore ? posts.slice(0, pageSize) : posts;
    const nextCursor = hasMore ? results[results.length - 1]._id : null;

    // Attach user's vote status if authenticated
    if (req.user) {
      const postIds = results.map((p) => p._id);
      const userVotes = await Vote.find({
        user: req.user._id,
        target: { $in: postIds },
        targetModel: 'Post',
      }).lean();

      const voteMap = {};
      userVotes.forEach((v) => { voteMap[v.target.toString()] = v.value; });
      results.forEach((p) => { p.userVote = voteMap[p._id.toString()] || 0; });

      // Attach bookmark status
      const bookmarks = await Bookmark.find({
        user: req.user._id,
        post: { $in: postIds },
      }).lean();
      const bookmarkSet = new Set(bookmarks.map((b) => b.post.toString()));
      results.forEach((p) => { p.isBookmarked = bookmarkSet.has(p._id.toString()); });
    }

    res.json({ success: true, posts: results, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/posts — Create post ─────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { title, body, excerpt, communityId, tags, flair, postType, linkUrl, isNSFW, isSpoiler } = req.body;

    if (!title || !communityId) {
      return res.status(400).json({ message: 'Title and community are required.' });
    }

    // Check community exists and user is a member (for restricted/private)
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found.' });

    if (community.type !== 'public') {
      const isMember = community.members.includes(req.user._id);
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a member to post in this community.' });
      }
    }

    const post = await Post.create({
      title,
      body,
      excerpt,
      author: req.user._id,
      community: communityId,
      tags: tags || [],
      flair,
      postType: postType || 'text',
      linkUrl,
      isNSFW: !!isNSFW,
      isSpoiler: !!isSpoiler,
    });

    await post.calculateHotScore();
    await post.save();

    await post.populate('author', 'username displayName avatar');
    await post.populate('community', 'name displayName avatar color slug');

    // Invalidate trending cache
    await delCache('trending:posts');

    // Check first-post achievement
    const awarded = await checkAchievements(req.user._id, 'firstPost');
    if (awarded.length > 0) {
      // Notify user of achievement (fire-and-forget)
      Notification.create({
        recipient: req.user._id,
        type: 'achievement',
        message: `You earned the "${awarded[0]}" achievement!`,
      }).catch(console.error);
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/posts/:id — Single post ──────────────────────────────────────
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar reputation')
      .populate('community', 'name displayName avatar color slug description');

    if (!post || post.status === 'removed') {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Increment view count (fire-and-forget)
    Post.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});

    let userVote = 0;
    let isBookmarked = false;

    if (req.user) {
      const vote = await Vote.findOne({ user: req.user._id, target: post._id, targetModel: 'Post' });
      userVote = vote?.value || 0;

      const bookmark = await Bookmark.findOne({ user: req.user._id, post: post._id });
      isBookmarked = !!bookmark;
    }

    res.json({ success: true, post, userVote, isBookmarked });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/posts/:id — Edit post ─────────────────────────────────────────
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const isOwner = post.author.toString() === req.user._id.toString();
    const isMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isOwner && !isMod) {
      return res.status(403).json({ message: 'Not authorized to edit this post.' });
    }

    const allowedUpdates = ['title', 'body', 'excerpt', 'tags', 'flair', 'isNSFW', 'isSpoiler'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });

    // Mods can change status
    if (isMod && req.body.status) post.status = req.body.status;
    if (isMod && req.body.isPinned !== undefined) post.isPinned = req.body.isPinned;
    if (isMod && req.body.isFeatured !== undefined) post.isFeatured = req.body.isFeatured;

    await post.save();
    await post.populate('author', 'username displayName avatar');
    await post.populate('community', 'name displayName avatar color slug');

    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/posts/:id ──────────────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const isOwner = post.author.toString() === req.user._id.toString();
    const isMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isOwner && !isMod) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    post.status = 'removed';
    await post.save();

    res.json({ success: true, message: 'Post removed.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/posts/:id/vote ───────────────────────────────────────────────
const votePost = async (req, res, next) => {
  try {
    const { value } = req.body; // 1 or -1
    if (![1, -1].includes(Number(value))) {
      return res.status(400).json({ message: 'Vote value must be 1 or -1.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const existingVote = await Vote.findOne({
      user: req.user._id,
      target: post._id,
      targetModel: 'Post',
    });

    let repDelta = 0;

    if (existingVote) {
      if (existingVote.value === Number(value)) {
        // Toggle off (remove vote)
        await existingVote.deleteOne();
        if (value === 1) {
          post.upvotes = Math.max(0, post.upvotes - 1);
          repDelta = -10;
        } else {
          post.downvotes = Math.max(0, post.downvotes - 1);
          repDelta = 2;
        }
      } else {
        // Change vote direction
        const oldValue = existingVote.value;
        existingVote.value = Number(value);
        await existingVote.save();

        if (oldValue === 1) {
          post.upvotes = Math.max(0, post.upvotes - 1);
          post.downvotes += 1;
          repDelta = -12; // lose +10 gain -2
        } else {
          post.downvotes = Math.max(0, post.downvotes - 1);
          post.upvotes += 1;
          repDelta = 12;
        }
      }
    } else {
      // New vote
      await Vote.create({ user: req.user._id, target: post._id, targetModel: 'Post', value: Number(value) });
      if (value === 1) {
        post.upvotes += 1;
        repDelta = 10;
      } else {
        post.downvotes += 1;
        repDelta = -2;
      }
    }

    post.score = post.upvotes - post.downvotes;
    post.voteCount = post.upvotes + post.downvotes;
    post.calculateHotScore();
    await post.save();

    // Adjust author reputation (fire-and-forget)
    if (repDelta !== 0 && post.author.toString() !== req.user._id.toString()) {
      adjustReputation(post.author, repDelta).catch(console.error);
      checkAchievements(post.author, 'popularPost').catch(console.error);
      checkAchievements(post.author, 'reputation').catch(console.error);
    }

    // Send notification to post author on upvote
    if (Number(value) === 1 && post.author.toString() !== req.user._id.toString() && !existingVote) {
      Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'upvote',
        post: post._id,
        message: `${req.user.displayName || req.user.username} upvoted your post.`,
      }).catch(console.error);
    }

    res.json({
      success: true,
      score: post.score,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/posts/:id/save — Bookmark toggle ────────────────────────────
const savePost = async (req, res, next) => {
  try {
    const existing = await Bookmark.findOne({ user: req.user._id, post: req.params.id });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false });
    }

    await Bookmark.create({ user: req.user._id, post: req.params.id });
    res.json({ success: true, saved: true });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/posts/trending ────────────────────────────────────────────────
const getTrending = async (req, res, next) => {
  try {
    const cacheKey = 'trending:posts';
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, posts: cached, cached: true });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const posts = await Post.find({ status: 'published', createdAt: { $gte: since } })
      .sort({ score: -1, commentCount: -1 })
      .limit(10)
      .populate('author', 'username displayName avatar')
      .populate('community', 'name displayName color slug')
      .lean();

    await setCache(cacheKey, posts, 300); // 5 min TTL

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/posts/popular ─────────────────────────────────────────────────
const getPopular = async (req, res, next) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const pageSize = Math.min(parseInt(limit), 20);
    const filter = { status: 'published', score: { $gte: 10 } };

    if (cursor) {
      const cursorPost = await Post.findById(cursor).select('score');
      if (cursorPost) filter.score.$lte = cursorPost.score;
    }

    const posts = await Post.find(filter)
      .sort({ score: -1 })
      .limit(pageSize + 1)
      .populate('author', 'username displayName avatar')
      .populate('community', 'name displayName color slug')
      .lean();

    const hasMore = posts.length > pageSize;
    res.json({ success: true, posts: posts.slice(0, pageSize), hasMore, nextCursor: hasMore ? posts[pageSize - 1]._id : null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, createPost, getPost, updatePost, deletePost, votePost, savePost, getTrending, getPopular };
