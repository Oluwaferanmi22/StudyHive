const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/messages
// @desc    Get messages for a hive
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Messages endpoint - Coming soon!' });
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, (req, res) => {
  res.json({ message: 'Send message - Coming soon!' });
});

module.exports = router;
