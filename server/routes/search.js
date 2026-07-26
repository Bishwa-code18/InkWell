// routes/search.js
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const { search } = require('../controllers/searchController');

router.get('/', optionalAuth, search);

module.exports = router;
