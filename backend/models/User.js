const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'Please provide your first name'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Please provide your last name'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    institution: {
      type: String,
      maxlength: [100, 'Institution name cannot exceed 100 characters'],
      default: ''
    },
    studyYear: {
      type: String,
      enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'],
      default: 'Other'
    },
    major: {
      type: String,
      maxlength: [100, 'Major cannot exceed 100 characters'],
      default: ''
    }
  },
  preferences: {
    studySubjects: [{
      type: String,
      trim: true
    }],
    studyGoals: [{
      type: String,
      trim: true
    }],
    availabilityHours: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'],
      default: 'Flexible'
    },
    preferredGroupSize: {
      type: String,
      enum: ['Small (2-4)', 'Medium (5-8)', 'Large (9+)', 'Any'],
      default: 'Any'
    }
  },
  gamification: {
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      icon: String
    }],
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastActivity: Date
    }
  },
  hives: [{
    hiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyHive'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'preferences.studySubjects': 1 });
userSchema.index({ 'gamification.points': -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate level based on points
userSchema.methods.calculateLevel = function() {
  // Simple formula: level = floor(sqrt(points / 100)) + 1
  const level = Math.floor(Math.sqrt(this.gamification.points / 100)) + 1;
  this.gamification.level = level;
  return level;
};

// Method to add points
userSchema.methods.addPoints = function(points, reason = 'Activity') {
  this.gamification.points += points;
  this.calculateLevel();
  
  // Update streak if it's a new day
  const today = new Date();
  const lastActivity = this.gamification.streak.lastActivity;
  
  if (!lastActivity || !this.isSameDay(lastActivity, today)) {
    if (lastActivity && this.isConsecutiveDay(lastActivity, today)) {
      this.gamification.streak.current += 1;
      if (this.gamification.streak.current > this.gamification.streak.longest) {
        this.gamification.streak.longest = this.gamification.streak.current;
      }
    } else if (!lastActivity || !this.isConsecutiveDay(lastActivity, today)) {
      this.gamification.streak.current = 1;
    }
    this.gamification.streak.lastActivity = today;
  }
  
  this.lastActive = today;
};

// Helper method to check if two dates are the same day
userSchema.methods.isSameDay = function(date1, date2) {
  return date1.toDateString() === date2.toDateString();
};

// Helper method to check if dates are consecutive days
userSchema.methods.isConsecutiveDay = function(lastDate, currentDate) {
  const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
  return daysDiff === 1;
};

// Method to add badge
userSchema.methods.addBadge = function(name, description, icon) {
  const existingBadge = this.gamification.badges.find(badge => badge.name === name);
  if (!existingBadge) {
    this.gamification.badges.push({
      name,
      description,
      icon,
      earnedAt: new Date()
    });
  }
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
