// controllers/communitiesController.js — Community CRUD + join/leave
const Community = require('../models/Community');
const Post = require('../models/Post');
const { getCache, setCache, delCache } = require('../config/redis');

// ── GET /api/communities ───────────────────────────────────────────────────
const getCommunities = async (req, res, next) => {
  try {
    const { sort = 'trending', cursor, limit = 12 } = req.query;
    const pageSize = Math.min(parseInt(limit), 24);

    const filter = {};
    const sortMap = { trending: { memberCount: -1 }, newest: { createdAt: -1 } };

    const communities = await Community.find(filter)
      .sort(sortMap[sort] || { memberCount: -1 })
      .limit(pageSize + 1)
      .populate('creator', 'username displayName')
      .lean();

    // Attach membership status for authenticated user
    if (req.user) {
      communities.forEach((c) => {
        c.isMember = c.members.some((m) => m.toString() === req.user._id.toString());
      });
    }

    const hasMore = communities.length > pageSize;
    res.json({ success: true, communities: communities.slice(0, pageSize), hasMore });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/communities ──────────────────────────────────────────────────
const createCommunity = async (req, res, next) => {
  try {
    const { name, displayName, description, longDescription, type, topics, color } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'Name and display name are required.' });
    }

    const existing = await Community.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A community with this name already exists.' });
    }

    const community = await Community.create({
      name: name.toLowerCase(),
      displayName,
      description,
      longDescription,
      type: type || 'public',
      topics: topics || [],
      color: color || '#1A6B47',
      creator: req.user._id,
      moderators: [req.user._id],
      members: [req.user._id],
      memberCount: 1,
    });

    await community.populate('creator', 'username displayName avatar');

    // Check explorer achievement (joined/created 5 communities) — fire-and-forget
    const { checkAchievements } = require('../utils/calculateReputation');
    checkAchievements(req.user._id, 'explorer').catch(console.error);

    res.status(201).json({ success: true, community });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/communities/:slug ─────────────────────────────────────────────
const getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
      .populate('creator', 'username displayName avatar')
      .populate('moderators', 'username displayName avatar');

    if (!community) return res.status(404).json({ message: 'Community not found.' });

    let isMember = false;
    let isMod = false;

    if (req.user) {
      isMember = community.members.includes(req.user._id);
      isMod = community.moderators.some((m) => m._id.toString() === req.user._id.toString());
    }

    res.json({ success: true, community, isMember, isMod });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/communities/:slug ─────────────────────────────────────────────
const updateCommunity = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return res.status(404).json({ message: 'Community not found.' });

    const isMod = community.moderators.some((m) => m.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isMod && !isAdmin) {
      return res.status(403).json({ message: 'Only moderators can update community settings.' });
    }

    const allowed = ['displayName', 'description', 'longDescription', 'type', 'topics', 'color', 'settings', 'isFeatured'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) community[field] = req.body[field];
    });

    await community.save();
    res.json({ success: true, community });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/communities/:slug/join — Toggle join/leave ──────────────────
const joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return res.status(404).json({ message: 'Community not found.' });

    const userId = req.user._id;
    const isMember = community.members.some((m) => m.toString() === userId.toString());

    if (isMember) {
      // Leave
      community.members = community.members.filter((m) => m.toString() !== userId.toString());
      community.memberCount = Math.max(0, community.memberCount - 1);
      await community.save();
      return res.json({ success: true, joined: false, memberCount: community.memberCount });
    }

    // Join
    community.members.push(userId);
    community.memberCount += 1;
    await community.save();

    // Invalidate community stats cache
    await delCache(`community:${community.slug}:stats`);

    res.json({ success: true, joined: true, memberCount: community.memberCount });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/communities/:slug/posts ──────────────────────────────────────
const getCommunityPosts = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return res.status(404).json({ message: 'Community not found.' });

    const { sort = 'hot', cursor, limit = 10 } = req.query;
    const pageSize = Math.min(parseInt(limit), 20);
    const filter = { community: community._id, status: 'published' };

    const sortMap = { hot: { hotScore: -1 }, new: { createdAt: -1 }, top: { score: -1 } };

    const posts = await Post.find(filter)
      .sort(sortMap[sort] || { hotScore: -1 })
      .limit(pageSize + 1)
      .populate('author', 'username displayName avatar')
      .populate('community', 'name displayName avatar color slug')
      .lean();

    const hasMore = posts.length > pageSize;
    res.json({ success: true, posts: posts.slice(0, pageSize), hasMore, community });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/communities/:slug/members ────────────────────────────────────
const getMembers = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug })
      .populate('members', 'username displayName avatar reputation')
      .select('members memberCount');

    if (!community) return res.status(404).json({ message: 'Community not found.' });
    res.json({ success: true, members: community.members, memberCount: community.memberCount });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/communities/:slug/rules ────────────────────────────────────
const addRule = async (req, res, next) => {
  try {
    const community = await Community.findOne({ slug: req.params.slug });
    if (!community) return res.status(404).json({ message: 'Community not found.' });

    const isMod = community.moderators.some((m) => m.toString() === req.user._id.toString());
    if (!isMod && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only moderators can add rules.' });
    }

    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'Rule title is required.' });

    community.rules.push({ title, body });
    await community.save();

    res.status(201).json({ success: true, rules: community.rules });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCommunities, createCommunity, getCommunity, updateCommunity, joinCommunity, getCommunityPosts, getMembers, addRule };
