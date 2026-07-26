// controllers/searchController.js — Full-text search across posts, communities, users
const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');

const search = async (req, res, next) => {
  try {
    const { q, type = 'posts', sort = 'relevance', limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters.' });
    }

    const query = q.trim();
    const pageSize = Math.min(parseInt(limit), 20);

    let results = [];

    if (type === 'posts' || type === 'all') {
      const sortMap = { relevance: { score: { $meta: 'textScore' } }, new: { createdAt: -1 }, top: { score: -1 } };
      const posts = await Post.find(
        { $text: { $search: query }, status: 'published' },
        sort === 'relevance' ? { score: { $meta: 'textScore' } } : {}
      )
        .sort(sortMap[sort] || { score: { $meta: 'textScore' } })
        .limit(pageSize)
        .populate('author', 'username displayName avatar')
        .populate('community', 'name displayName color slug')
        .lean();

      if (type === 'posts') return res.json({ success: true, type: 'posts', results: posts });
      results.push(...posts.map((p) => ({ ...p, resultType: 'post' })));
    }

    if (type === 'communities' || type === 'all') {
      const communities = await Community.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(pageSize)
        .lean();

      if (type === 'communities') return res.json({ success: true, type: 'communities', results: communities });
      results.push(...communities.map((c) => ({ ...c, resultType: 'community' })));
    }

    if (type === 'users' || type === 'all') {
      const regex = new RegExp(query, 'i');
      const isModOrAdmin = req.user && (req.user.role === 'moderator' || req.user.role === 'admin');
      const userQuery = {
        $or: [{ username: regex }, { displayName: regex }],
      };
      if (!isModOrAdmin) {
        userQuery.isBanned = false;
      }
      const users = await User.find(userQuery)
        .select('username displayName avatar bio reputation role isBanned')
        .limit(pageSize)
        .lean();

      if (type === 'users') return res.json({ success: true, type: 'users', results: users });
      results.push(...users.map((u) => ({ ...u, resultType: 'user' })));
    }

    res.json({ success: true, type: 'all', results });
  } catch (err) {
    next(err);
  }
};

module.exports = { search };
