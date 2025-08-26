const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
  getUserStats
};
