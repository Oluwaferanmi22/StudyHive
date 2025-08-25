const mongoose = require('mongoose');

const studyHiveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a hive name'],
    trim: true,
    minlength: [3, 'Hive name must be at least 3 characters'],
    maxlength: [100, 'Hive name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please specify the subject'],
    trim: true,
    maxlength: [50, 'Subject cannot exceed 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    contributionScore: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50,
      max: [200, 'Maximum members cannot exceed 200']
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowQuestions: {
      type: Boolean,
      default: true
    },
    studySchedule: {
      type: String,
      enum: ['Flexible', 'Daily', 'Weekly', 'Exam Period', 'Custom'],
      default: 'Flexible'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalResources: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  },
  studySessions: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attendees: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['interested', 'attending', 'attended', 'missed'],
        default: 'interested'
      }
    }],
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: null
    },
    meetingLink: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  announcements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  joinRequests: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Join request message cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
studyHiveSchema.index({ subject: 1 });
studyHiveSchema.index({ tags: 1 });
studyHiveSchema.index({ 'settings.isPrivate': 1 });
studyHiveSchema.index({ creator: 1 });
studyHiveSchema.index({ 'members.userId': 1 });
studyHiveSchema.index({ createdAt: -1 });
studyHiveSchema.index({ lastActivity: -1 });

// Virtual for member count
studyHiveSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for admin members
studyHiveSchema.virtual('admins').get(function() {
  return this.members ? this.members.filter(member => member.role === 'admin') : [];
});

// Virtual for moderator members
studyHiveSchema.virtual('moderators').get(function() {
  return this.members ? this.members.filter(member => member.role === 'moderator') : [];
});

// Method to check if user is a member
studyHiveSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString());
};

// Method to get member role
studyHiveSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => member.userId.toString() === userId.toString());
  return member ? member.role : null;
};

// Method to check if user can moderate
studyHiveSchema.methods.canModerate = function(userId) {
  const role = this.getMemberRole(userId);
  return role === 'admin' || role === 'moderator';
};

// Method to check if user can administrate
studyHiveSchema.methods.canAdministrate = function(userId) {
  const role = this.getMemberRole(userId);
  return role === 'admin' || this.creator.toString() === userId.toString();
};

// Method to add member
studyHiveSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      userId,
      role,
      joinedAt: new Date(),
      lastActive: new Date(),
      contributionScore: 0
    });
    this.lastActivity = new Date();
  }
};

// Method to remove member
studyHiveSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.userId.toString() !== userId.toString());
  this.lastActivity = new Date();
};

// Method to update member role
studyHiveSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => member.userId.toString() === userId.toString());
  if (member) {
    member.role = newRole;
    this.lastActivity = new Date();
  }
};

// Method to increment statistics
studyHiveSchema.methods.incrementStat = function(statName) {
  if (this.statistics.hasOwnProperty(statName)) {
    this.statistics[statName] += 1;
    this.lastActivity = new Date();
  }
};

// Method to update active members count
studyHiveSchema.methods.updateActiveMembers = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeCount = this.members.filter(member => member.lastActive >= thirtyDaysAgo).length;
  this.statistics.activeMembers = activeCount;
};

// Method to add study session
studyHiveSchema.methods.addStudySession = function(sessionData) {
  this.studySessions.push(sessionData);
  this.lastActivity = new Date();
};

// Method to add announcement
studyHiveSchema.methods.addAnnouncement = function(title, content, authorId, isPinned = false) {
  this.announcements.unshift({
    title,
    content,
    author: authorId,
    isPinned,
    createdAt: new Date()
  });
  this.lastActivity = new Date();
};

// Ensure virtual fields are serialized
studyHiveSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to update statistics
studyHiveSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.updateActiveMembers();
  }
  next();
});

module.exports = mongoose.model('StudyHive', studyHiveSchema);
