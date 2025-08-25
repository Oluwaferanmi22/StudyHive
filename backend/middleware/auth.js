const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token is in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the database (exclude password)
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is member of specific hive
const checkHiveMembership = async (req, res, next) => {
  try {
    const hiveId = req.params.hiveId || req.body.hiveId;
    
    if (!hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Hive ID is required'
      });
    }

    const StudyHive = require('../models/StudyHive');
    const hive = await StudyHive.findById(hiveId);
    
    if (!hive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user is a member
    const isMember = hive.isMember(req.user.id);
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to access this resource'
      });
    }

    req.hive = hive;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Check if user can moderate hive
const checkHiveModerator = async (req, res, next) => {
  try {
    const hiveId = req.params.hiveId || req.body.hiveId;
    
    if (!hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Hive ID is required'
      });
    }

    const StudyHive = require('../models/StudyHive');
    const hive = await StudyHive.findById(hiveId);
    
    if (!hive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can moderate
    const canModerate = hive.canModerate(req.user.id);
    
    if (!canModerate) {
      return res.status(403).json({
        success: false,
        message: 'You must be a moderator or admin of this hive to perform this action'
      });
    }

    req.hive = hive;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Check if user can administrate hive
const checkHiveAdmin = async (req, res, next) => {
  try {
    const hiveId = req.params.hiveId || req.body.hiveId;
    
    if (!hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Hive ID is required'
      });
    }

    const StudyHive = require('../models/StudyHive');
    const hive = await StudyHive.findById(hiveId);
    
    if (!hive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    // Check if user can administrate
    const canAdministrate = hive.canAdministrate(req.user.id);
    
    if (!canAdministrate) {
      return res.status(403).json({
        success: false,
        message: 'You must be an admin or creator of this hive to perform this action'
      });
    }

    req.hive = hive;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Optional authentication (for public routes that may benefit from user data)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid but continue anyway
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Rate limiting middleware (basic implementation)
const rateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      const filtered = timestamps.filter(time => time > windowStart);
      if (filtered.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, filtered);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    next();
  };
};

module.exports = {
  protect,
  authorize,
  checkHiveMembership,
  checkHiveModerator,
  checkHiveAdmin,
  optionalAuth,
  rateLimiter
};
