// routes/upload.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { uploadImage: uploadMiddleware } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.post('/image', protect, uploadLimiter, uploadMiddleware.single('image'), uploadImage);
router.delete('/:publicId(*)', protect, deleteImage);

module.exports = router;
