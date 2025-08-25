const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats
} = require('../controllers/authController');
const { protect, rateLimiter } = require('../middleware/auth');

// Rate limiting for auth endpoints
const authRateLimit = rateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
const profileRateLimit = rateLimiter(60 * 1000, 10); // 10 requests per minute

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authRateLimit, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authRateLimit, login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, profileRateLimit, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, authRateLimit, changePassword);

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, deleteAccount);

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, getUserStats);

module.exports = router;
