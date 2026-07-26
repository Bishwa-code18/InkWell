// routes/posts.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getPosts, createPost, getPost, updatePost, deletePost,
  votePost, savePost, getTrending, getPopular,
} = require('../controllers/postsController');
const { search } = require('../controllers/searchController');

// Public / optional auth
router.get('/', optionalAuth, getPosts);
router.get('/trending', getTrending);
router.get('/popular', optionalAuth, getPopular);
router.get('/search', search);
router.get('/:id', optionalAuth, getPost);

// Protected
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/vote', protect, votePost);
router.post('/:id/save', protect, savePost);

module.exports = router;
