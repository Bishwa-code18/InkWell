// routes/comments.js — mounted at /api/posts/:postId/comments
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for :postId
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getComments, createComment, updateComment, deleteComment, voteComment,
} = require('../controllers/commentsController');

router.get('/', optionalAuth, getComments);
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/vote', protect, voteComment);
router.post('/:id/reply', protect, createComment); // alias: body.parentId must be set

module.exports = router;
