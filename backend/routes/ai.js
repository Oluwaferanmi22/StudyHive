const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// @route   POST /api/ai/ask
// @desc    Ask the AI tutor a question
// @access  Private
router.post('/ask', protect, ask);

module.exports = router;
