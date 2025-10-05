const express = require('express');
const router = express.Router();
const { ask, health } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// @route   POST /api/ai/ask
// @desc    Ask the AI tutor a question
// @access  Private
router.post('/ask', protect, ask);

// @route   GET /api/ai/health
// @desc    AI service health/provider info
// @access  Public
router.get('/health', health);

module.exports = router;
