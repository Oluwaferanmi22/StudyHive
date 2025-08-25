const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/resources
// @desc    Get all resources
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Resources endpoint - Coming soon!' });
});

// @route   POST /api/resources
// @desc    Create a new resource
// @access  Private
router.post('/', protect, (req, res) => {
  res.json({ message: 'Create resource - Coming soon!' });
});

module.exports = router;
