// routes/communities.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getCommunities, createCommunity, getCommunity, updateCommunity,
  joinCommunity, getCommunityPosts, getMembers, addRule,
} = require('../controllers/communitiesController');

router.get('/', optionalAuth, getCommunities);
router.post('/', protect, createCommunity);
router.get('/:slug', optionalAuth, getCommunity);
router.put('/:slug', protect, updateCommunity);
router.post('/:slug/join', protect, joinCommunity);
router.get('/:slug/posts', optionalAuth, getCommunityPosts);
router.get('/:slug/members', getMembers);
router.post('/:slug/rules', protect, addRule);

module.exports = router;
