const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/hives
// @desc    Get all study hives
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Study Hives endpoint - Coming soon!' });
});

// @route   POST /api/hives
// @desc    Create a new study hive
// @access  Private
router.post('/', protect, (req, res) => {
  res.json({ message: 'Create hive - Coming soon!' });
});

// @route   GET /api/hives/:id
// @desc    Get study hive by ID
// @access  Private
router.get('/:id', protect, (req, res) => {
  res.json({ message: 'Get hive by ID - Coming soon!' });
});

module.exports = router;
