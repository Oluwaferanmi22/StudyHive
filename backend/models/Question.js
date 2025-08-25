const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a question title'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide question content'],
    trim: true,
    maxlength: [5000, 'Question content cannot exceed 5000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Question author is required']
  },
  hive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyHive',
    required: [true, 'Hive reference is required']
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
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  questionType: {
    type: String,
    enum: ['General', 'Homework Help', 'Concept Clarification', 'Exam Prep', 'Project Help', 'Study Tips'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  answers: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Answer content is required'],
      trim: true,
      maxlength: [5000, 'Answer cannot exceed 5000 characters']
    },
    attachments: [{
      fileName: String,
      filePath: String,
      fileType: String,
      fileSize: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    votes: {
      upvotes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }],
      downvotes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
    isAccepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date,
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      content: String,
      editedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Open', 'Answered', 'Closed', 'Under Review'],
    default: 'Open'
  },
  hasAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  bounty: {
    points: {
      type: Number,
      default: 0
    },
    offeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: Date,
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockReason: String,
  lockedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
questionSchema.index({ hive: 1, createdAt: -1 });
questionSchema.index({ author: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ isPinned: 1, hive: 1 });
questionSchema.index({ lastActivity: -1 });

// Virtual for question score
questionSchema.virtual('score').get(function() {
  const upvotes = this.votes.upvotes ? this.votes.upvotes.length : 0;
  const downvotes = this.votes.downvotes ? this.votes.downvotes.length : 0;
  return upvotes - downvotes;
});

// Virtual for answer count
questionSchema.virtual('answerCount').get(function() {
  return this.answers ? this.answers.length : 0;
});

// Virtual for view count
questionSchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

// Virtual for follower count
questionSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Method to add vote
questionSchema.methods.addVote = function(userId, voteType) {
  const upvoteIndex = this.votes.upvotes.findIndex(vote => vote.user.toString() === userId.toString());
  const downvoteIndex = this.votes.downvotes.findIndex(vote => vote.user.toString() === userId.toString());
  
  if (voteType === 'upvote') {
    // Remove from downvotes if present
    if (downvoteIndex !== -1) {
      this.votes.downvotes.splice(downvoteIndex, 1);
    }
    
    // Toggle upvote
    if (upvoteIndex === -1) {
      this.votes.upvotes.push({ user: userId, votedAt: new Date() });
    } else {
      this.votes.upvotes.splice(upvoteIndex, 1);
    }
  } else if (voteType === 'downvote') {
    // Remove from upvotes if present
    if (upvoteIndex !== -1) {
      this.votes.upvotes.splice(upvoteIndex, 1);
    }
    
    // Toggle downvote
    if (downvoteIndex === -1) {
      this.votes.downvotes.push({ user: userId, votedAt: new Date() });
    } else {
      this.votes.downvotes.splice(downvoteIndex, 1);
    }
  }
  
  this.lastActivity = new Date();
};

// Method to add answer
questionSchema.methods.addAnswer = function(userId, content, attachments = []) {
  const answer = {
    author: userId,
    content,
    attachments,
    votes: { upvotes: [], downvotes: [] },
    isAccepted: false,
    isEdited: false,
    editHistory: [],
    comments: [],
    createdAt: new Date()
  };
  
  this.answers.push(answer);
  this.lastActivity = new Date();
  
  // Update status if it was open
  if (this.status === 'Open') {
    this.status = 'Answered';
  }
  
  return this.answers[this.answers.length - 1];
};

// Method to accept answer
questionSchema.methods.acceptAnswer = function(answerId, userId) {
  // Only question author can accept answers
  if (this.author.toString() !== userId.toString()) {
    return false;
  }
  
  // Remove previous accepted answer
  if (this.hasAcceptedAnswer) {
    const previousAccepted = this.answers.id(this.acceptedAnswer);
    if (previousAccepted) {
      previousAccepted.isAccepted = false;
    }
  }
  
  // Set new accepted answer
  const answer = this.answers.id(answerId);
  if (answer) {
    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    
    this.hasAcceptedAnswer = true;
    this.acceptedAnswer = answerId;
    this.status = 'Answered';
    this.lastActivity = new Date();
    
    return true;
  }
  
  return false;
};

// Method to vote on answer
questionSchema.methods.voteOnAnswer = function(answerId, userId, voteType) {
  const answer = this.answers.id(answerId);
  if (!answer) return false;
  
  const upvoteIndex = answer.votes.upvotes.findIndex(vote => vote.user.toString() === userId.toString());
  const downvoteIndex = answer.votes.downvotes.findIndex(vote => vote.user.toString() === userId.toString());
  
  if (voteType === 'upvote') {
    // Remove from downvotes if present
    if (downvoteIndex !== -1) {
      answer.votes.downvotes.splice(downvoteIndex, 1);
    }
    
    // Toggle upvote
    if (upvoteIndex === -1) {
      answer.votes.upvotes.push({ user: userId, votedAt: new Date() });
    } else {
      answer.votes.upvotes.splice(upvoteIndex, 1);
    }
  } else if (voteType === 'downvote') {
    // Remove from upvotes if present
    if (upvoteIndex !== -1) {
      answer.votes.upvotes.splice(upvoteIndex, 1);
    }
    
    // Toggle downvote
    if (downvoteIndex === -1) {
      answer.votes.downvotes.push({ user: userId, votedAt: new Date() });
    } else {
      answer.votes.downvotes.splice(downvoteIndex, 1);
    }
  }
  
  this.lastActivity = new Date();
  return true;
};

// Method to record view
questionSchema.methods.recordView = function(userId = null, ipAddress = '') {
  // Avoid duplicate views from same user in last 5 minutes
  if (userId) {
    const recentView = this.views.find(view => 
      view.user && 
      view.user.toString() === userId.toString() && 
      new Date() - view.viewedAt < 5 * 60 * 1000
    );
    
    if (recentView) return;
  }
  
  this.views.push({
    user: userId,
    viewedAt: new Date(),
    ipAddress
  });
};

// Method to follow/unfollow question
questionSchema.methods.toggleFollow = function(userId) {
  const followerIndex = this.followers.findIndex(f => f.user.toString() === userId.toString());
  
  if (followerIndex === -1) {
    // Add follower
    this.followers.push({
      user: userId,
      followedAt: new Date()
    });
    return true;
  } else {
    // Remove follower
    this.followers.splice(followerIndex, 1);
    return false;
  }
};

// Method to set bounty
questionSchema.methods.setBounty = function(userId, points, expiryDays = 7) {
  this.bounty = {
    points,
    offeredBy: userId,
    expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    isActive: true
  };
  
  this.lastActivity = new Date();
};

// Method to pin/unpin question
questionSchema.methods.togglePin = function(userId) {
  this.isPinned = !this.isPinned;
  
  if (this.isPinned) {
    this.pinnedBy = userId;
    this.pinnedAt = new Date();
  } else {
    this.pinnedBy = null;
    this.pinnedAt = null;
  }
  
  this.lastActivity = new Date();
};

// Method to lock/unlock question
questionSchema.methods.toggleLock = function(userId, reason = '') {
  this.isLocked = !this.isLocked;
  
  if (this.isLocked) {
    this.lockedBy = userId;
    this.lockReason = reason;
    this.lockedAt = new Date();
  } else {
    this.lockedBy = null;
    this.lockReason = '';
    this.lockedAt = null;
  }
  
  this.lastActivity = new Date();
};

// Pre-save middleware to update hive statistics
questionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const StudyHive = mongoose.model('StudyHive');
      await StudyHive.findByIdAndUpdate(
        this.hive,
        { 
          $inc: { 'statistics.totalQuestions': 1 },
          $set: { lastActivity: new Date() }
        }
      );
      
      // Award points to the author
      const User = mongoose.model('User');
      const author = await User.findById(this.author);
      if (author) {
        author.addPoints(5, 'Asked question');
        await author.save();
      }
    } catch (error) {
      console.error('Error updating hive question count:', error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
questionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Question', questionSchema);
