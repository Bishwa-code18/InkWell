// routes/users.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getMe, updateMe, changePassword, deleteMe, getUser,
  followUser, getUserPosts, getUserComments, getUserSaved,
  getUserAchievements, updateSettings,
} = require('../controllers/usersController');

// Current user
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);
router.put('/me/settings', protect, updateSettings);
router.delete('/me', protect, deleteMe);

// Public user routes
router.get('/:username', optionalAuth, getUser);
router.post('/:username/follow', protect, followUser);
router.get('/:username/posts', getUserPosts);
router.get('/:username/comments', getUserComments);
router.get('/:username/saved', protect, getUserSaved);
router.get('/:username/achievements', getUserAchievements);

module.exports = router;
