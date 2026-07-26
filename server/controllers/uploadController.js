// controllers/uploadController.js — Cloudinary image upload/delete
const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // multer-storage-cloudinary already uploaded the file; get details from req.file
    const { path: url, filename: publicId } = req.file;

    res.json({
      success: true,
      url,
      publicId,
    });
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) return res.status(400).json({ message: 'Public ID required.' });

    // Only allow deletion of files in the inkwell folder
    if (!publicId.startsWith('inkwell/')) {
      return res.status(403).json({ message: 'Unauthorized deletion.' });
    }

    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage, deleteImage };
