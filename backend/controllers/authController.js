const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtp } = require('../services/emailService');
let OAuth2Client = null;
try {
  ({ OAuth2Client } = require('google-auth-library'));
} catch (e) {
  OAuth2Client = null; // Optional dependency
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = (googleClientId && OAuth2Client) ? new OAuth2Client(googleClientId) : null;

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};  

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      institution,
      studyYear,
      major,
      studySubjects,
      studyGoals,
      availabilityHours,
      preferredGroupSize
    } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, first name, and last name'
      });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (user) {
      const field = user.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password,
      profile: {
        firstName,
        lastName,
        institution: institution || '',
        studyYear: studyYear || 'Other',
        major: major || ''
      },
      preferences: {
        studySubjects: studySubjects || [],
        studyGoals: studyGoals || [],
        availabilityHours: availabilityHours || 'Flexible',
        preferredGroupSize: preferredGroupSize || 'Any'
      }
    });

    // Award welcome badge
    user.addBadge('Welcome', 'Welcome to StudyHive!', '🎉');
    
    // Generate and send OTP for email verification
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.emailVerification = {
      otpCode: code,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();
    try {
      await sendOtp(email, code);
    } catch (e) {
      // Do not fail registration if email send fails; client can request resend
      console.warn('OTP email send failed:', e.message);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent to you.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        gamification: user.gamification,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Send OTP to email for verification (resend)
// @route   POST /api/auth/otp/send
// @access  Public
const sendOtpHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.emailVerification = {
      otpCode: code,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();
    await sendOtp(email, code);
    return res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/otp/verify
// @access  Public
const verifyOtpHandler = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { emailVerification } = user;
    if (!emailVerification || !emailVerification.otpCode || !emailVerification.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP requested' });
    }
    if (emailVerification.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (String(emailVerification.otpCode) !== String(code)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    user.isEmailVerified = true;
    user.emailVerification = { otpCode: null, otpExpires: null };
    await user.save();
    const token = generateToken(user._id);
    return res.status(200).json({ success: true, message: 'Email verified', token });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Google login via ID token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }
    if (!googleClient) {
      return res.status(500).json({ success: false, message: 'Google client not configured' });
    }
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    const emailVerified = payload.email_verified;

    let user = await User.findOne({ $or: [ { email }, { 'oauth.googleId': googleId } ] });
    if (!user) {
      // Create new user with minimal profile
      const usernameBase = email.split('@')[0];
      const uniqueUsername = usernameBase + '_' + Math.random().toString(36).slice(2,8);
      user = await User.create({
        username: uniqueUsername,
        email,
        password: Math.random().toString(36),
        oauth: { googleId },
        isEmailVerified: emailVerified,
        profile: { firstName: payload.given_name || 'User', lastName: payload.family_name || 'Google' },
        preferences: {}
      });
      user.addBadge('Welcome', 'Welcome to StudyHive!', '🎉');
      await user.save();
    } else {
      // Link googleId if not set
      if (!user.oauth) user.oauth = {};
      if (!user.oauth.googleId) user.oauth.googleId = googleId;
      if (emailVerified && !user.isEmailVerified) user.isEmailVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);
    return res.status(200).json({ success: true, message: 'Google login successful', token, user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      gamification: user.gamification
    }});
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Auth service health check
// @route   GET /api/auth/health
// @access  Public
const health = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: 'Auth OK' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Auth health error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Validation
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    // Find user by email or username (include password for verification)
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Enforce email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify with the OTP sent to your email.'
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        gamification: user.gamification,
        preferences: user.preferences,
        isPremium: user.isPremium,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'hives.hiveId',
        select: 'name description subject memberCount'
      });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      institution,
      studyYear,
      major,
      studySubjects,
      studyGoals,
      availabilityHours,
      preferredGroupSize
    } = req.body;

    const user = await User.findById(req.user.id);

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    if (institution !== undefined) user.profile.institution = institution;
    if (studyYear) user.profile.studyYear = studyYear;
    if (major !== undefined) user.profile.major = major;

    // Update preferences
    if (studySubjects) user.preferences.studySubjects = studySubjects;
    if (studyGoals) user.preferences.studyGoals = studyGoals;
    if (availabilityHours) user.preferences.availabilityHours = availabilityHours;
    if (preferredGroupSize) user.preferences.preferredGroupSize = preferredGroupSize;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        preferences: user.preferences,
        gamification: user.gamification
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Remove user from all hives
    const StudyHive = require('../models/StudyHive');
    await StudyHive.updateMany(
      { 'members.userId': user._id },
      { $pull: { members: { userId: user._id } } }
    );

    // Delete user's resources, messages, and questions
    const Resource = require('../models/Resource');
    const Message = require('../models/Message');
    const Question = require('../models/Question');
    
    await Resource.deleteMany({ author: user._id });
    await Message.deleteMany({ author: user._id });
    await Question.deleteMany({ author: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for user's activities
    const Resource = require('../models/Resource');
    const Question = require('../models/Question');
    const Message = require('../models/Message');

    const [resourceCount, questionCount, messageCount] = await Promise.all([
      Resource.countDocuments({ author: userId }),
      Question.countDocuments({ author: userId }),
      Message.countDocuments({ author: userId })
    ]);

    // Get user with populated hives
    const user = await User.findById(userId)
      .populate({
        path: 'hives.hiveId',
        select: 'name subject memberCount'
      });

    const stats = {
      profile: {
        level: user.gamification.level,
        points: user.gamification.points,
        badges: user.gamification.badges.length,
        streak: user.gamification.streak.current
      },
      activity: {
        hivesJoined: user.hives.length,
        resourcesShared: resourceCount,
        questionsAsked: questionCount,
        messagesSent: messageCount
      },
      hives: user.hives.map(hive => ({
        id: hive.hiveId._id,
        name: hive.hiveId.name,
        subject: hive.hiveId.subject,
        role: hive.role,
        joinedAt: hive.joinedAt,
        memberCount: hive.hiveId.memberCount
      }))
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats,
  // Added: simple health endpoint for demos/monitoring
  health,
  sendOtp: sendOtpHandler,
  verifyOtp: verifyOtpHandler,
  googleLogin
};
