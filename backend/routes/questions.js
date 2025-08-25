const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/questions
// @desc    Get all questions
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Questions endpoint - Coming soon!' });
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', protect, (req, res) => {
  res.json({ message: 'Create question - Coming soon!' });
});

module.exports = router;
