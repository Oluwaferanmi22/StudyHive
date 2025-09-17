const User = require('../models/User');
const axios = require('axios');
const { getProvider } = require('../services/payments');

// Payment provider (default: paystack)
const paymentsProvider = getProvider();

// @desc    Get payments configuration (display only)
// @route   GET /api/payments/config
// @access  Public (no secrets revealed)
const getConfig = async (req, res) => {
  try {
    const provider = (process.env.PAYMENTS_PROVIDER || 'paystack').toLowerCase();
    const priceMajor = Number(process.env.PREMIUM_PRICE_MAJOR || 5000);
    const currency = provider === 'stripe'
      ? (process.env.STRIPE_CURRENCY || 'usd').toUpperCase()
      : 'NGN';

    return res.status(200).json({
      success: true,
      data: {
        provider,
        currency,
        priceMajor,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

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

    // Validate amount
    const provider = (process.env.PAYMENTS_PROVIDER || 'paystack').toLowerCase();
    const expected = Number(process.env.PREMIUM_PRICE_MAJOR || 5000);
    if (provider === 'paystack') {
      if (Number(amount) !== expected) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount for premium plan'
        });
      }
    } else {
      // For Stripe or others, allow positive amount and rely on env STRIPE_CURRENCY and PREMIUM_PRICE_MAJOR
      if (!(Number(amount) > 0)) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }
    }

    // Create payment reference
    const reference = `studyhive_${userId}_${Date.now()}`;

    const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`;
    const metadata = {
      userId,
      plan,
      custom_fields: [
        { display_name: 'User ID', variable_name: 'user_id', value: userId },
        { display_name: 'Plan', variable_name: 'plan', value: plan }
      ]
    };

    const init = await paymentsProvider.initializePayment({
      email,
      amount, // in base currency unit; provider will convert as needed
      reference,
      callbackUrl,
      metadata
    });

    res.status(200).json({
      success: true,
      data: {
        authorization_url: init.authorizationUrl,
        access_code: init.accessCode,
        reference: init.reference
      }
    });
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

    // Verify payment via provider
    const verification = await paymentsProvider.verifyPayment(reference);

    if (verification.success) {
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
  trackAITutorUsage,
  getConfig
};
