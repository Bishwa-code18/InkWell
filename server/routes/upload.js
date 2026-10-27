// routes/upload.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { uploadImage: uploadMiddleware } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const cloudinary = require('../config/cloudinary');

// Guard: return 503 if Cloudinary is not configured
const requireCloudinary = (req, res, next) => {
  if (!cloudinary.isConfigured) {
    return res.status(503).json({ message: 'Image uploads are not configured on this server.' });
  }
  next();
};

router.post('/image', protect, uploadLimiter, requireCloudinary, uploadMiddleware.single('image'), uploadImage);
router.delete('/:publicId(*)', protect, requireCloudinary, deleteImage);

module.exports = router;
