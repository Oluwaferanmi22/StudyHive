const User = require('../models/User');
const axios = require('axios');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key';

// @desc    Initialize Paystack payment
// @route   POST /api/payments/initialize
// @access  Private
const initializePayment = async (req, res) => {
  try {
    const { email, amount, plan = 'premium' } = req.body;
    const userId = req.user.id;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email and amount are required'
      });
    }

    // Validate amount (should be 5000 NGN for premium)
    if (amount !== 5000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount for premium plan'
      });
    }

    // Create payment reference
    const reference = `studyhive_${userId}_${Date.now()}`;

    // Initialize payment with Paystack
    const paymentData = {
      email,
      amount: amount * 100, // Convert to kobo
      reference,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
      metadata: {
        userId,
        plan,
        custom_fields: [
          {
            display_name: 'User ID',
            variable_name: 'user_id',
            value: userId
          },
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: plan
          }
        ]
      }
    };

    const response = await axios.post('https://api.paystack.co/transaction/initialize', paymentData, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status) {
      res.status(200).json({
        success: true,
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initialize payment'
      });
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Verify Paystack payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    // Verify payment with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status && response.data.data.status === 'success') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Upgrade user to premium
      user.upgradeToPremium(12); // 12 months
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          isPremium: user.isPremium,
          premiumExpiresAt: user.premiumExpiresAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user usage stats
// @route   GET /api/payments/usage
// @access  Private
const getUserUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check and reset daily usage if needed
    user.checkAndResetDailyUsage();
    await user.save();

    const usage = {
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      aiTutorUsage: {
        daily: user.usage.aiTutorMessages.daily.count,
        total: user.usage.aiTutorMessages.total,
        dailyLimit: user.isPremium ? 'unlimited' : 20,
        remainingToday: user.isPremium ? 'unlimited' : Math.max(0, 20 - user.usage.aiTutorMessages.daily.count)
      }
    };

    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Track AI tutor usage
// @route   POST /api/payments/track-usage
// @access  Private
const trackAITutorUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can use AI tutor
    if (!user.canUseAITutor()) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached. Upgrade to premium for unlimited access.',
        data: {
          canUse: false,
          remainingToday: 0,
          dailyLimit: 20
        }
      });
    }

    // Increment usage
    user.incrementAITutorUsage();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        canUse: true,
        remainingToday: user.isPremium ? 'unlimited' : Math.max(0, 20 - user.usage.aiTutorMessages.daily.count),
        dailyLimit: user.isPremium ? 'unlimited' : 20
      }
    });
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getUserUsage,
  trackAITutorUsage
};
