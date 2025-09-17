const express = require('express');
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  getUserUsage,
  trackAITutorUsage,
  getConfig
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// @route   POST /api/payments/initialize
// @desc    Initialize Paystack payment
// @access  Private
router.post('/initialize', protect, initializePayment);

// @route   POST /api/payments/verify
// @desc    Verify Paystack payment
// @access  Private
router.post('/verify', protect, verifyPayment);

// @route   GET /api/payments/usage
// @desc    Get user usage statistics
// @access  Private
router.get('/usage', protect, getUserUsage);

// @route   POST /api/payments/track-usage
// @desc    Track AI tutor usage
// @access  Private
router.post('/track-usage', protect, trackAITutorUsage);

// @route   GET /api/payments/config
// @desc    Get payments display configuration
// @access  Public
router.get('/config', getConfig);

module.exports = router;
