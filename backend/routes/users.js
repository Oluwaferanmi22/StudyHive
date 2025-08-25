const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (with filters)
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Users endpoint - Coming soon!' });
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, (req, res) => {
  res.json({ message: 'Get user by ID - Coming soon!' });
});

module.exports = router;
