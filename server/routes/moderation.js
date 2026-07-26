// routes/moderation.js — Routes for moderation actions
const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { 
  getReports, 
  createReport, 
  resolveReport, 
  updateUser,
  getModStats 
} = require('../controllers/moderationController');

// Submit a report (authenticated users only)
router.post('/reports', protect, createReport);

// All other routes require moderator/admin role
router.use(protect, requireRole('moderator', 'admin'));

router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.put('/users/:id', updateUser);
router.get('/stats', getModStats);

module.exports = router;
