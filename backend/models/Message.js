const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message author is required']
  },
  hive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyHive',
    required: [true, 'Hive reference is required']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system', 'poll', 'code', 'voice', 'ai'],
    default: 'text'
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
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    count: {
      type: Number,
      default: 0
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
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
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For code messages
  codeLanguage: {
    type: String,
    default: null
  },
  // For poll messages
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    allowMultiple: {
      type: Boolean,
      default: false
    },
    expiresAt: Date
  },
  // For voice messages
  voiceNote: {
    duration: {
      type: Number, // in seconds
      required: function() { return this.messageType === 'voice'; }
    },
    waveform: [Number], // for visual representation
    transcribedText: String // optional transcription
  },
  // For AI messages
  aiResponse: {
    model: String,
    confidence: Number,
    context: String
  }
}, {
  timestamps: true
});

// Create indexes for better performance
messageSchema.index({ hive: 1, createdAt: -1 });
messageSchema.index({ author: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ isPinned: 1, hive: 1 });

// Virtual for reply count
messageSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Method to add reaction
messageSchema.methods.addReaction = function(emoji, userId) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = {
      emoji,
      users: [userId],
      count: 1
    };
    this.reactions.push(reaction);
  } else {
    // Check if user already reacted with this emoji
    const userIndex = reaction.users.findIndex(id => id.toString() === userId.toString());
    
    if (userIndex === -1) {
      // Add user's reaction
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      // Remove user's reaction
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;
      
      // Remove reaction if no users left
      if (reaction.count === 0) {
        this.reactions = this.reactions.filter(r => r.emoji !== emoji);
      }
    }
  }
};

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

// Method to edit message
messageSchema.methods.editContent = function(newContent) {
  // Save current content to history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
};

// Method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.content = '[Message deleted]';
};

// Method to pin/unpin message
messageSchema.methods.togglePin = function(userId) {
  this.isPinned = !this.isPinned;
  
  if (this.isPinned) {
    this.pinnedBy = userId;
    this.pinnedAt = new Date();
  } else {
    this.pinnedBy = null;
    this.pinnedAt = null;
  }
};

// Method to add poll vote
messageSchema.methods.addPollVote = function(optionIndex, userId) {
  if (!this.poll || optionIndex >= this.poll.options.length) {
    return false;
  }
  
  const option = this.poll.options[optionIndex];
  const existingVote = option.votes.findIndex(id => id.toString() === userId.toString());
  
  if (existingVote === -1) {
    // Add vote
    option.votes.push(userId);
    
    // If not allowing multiple votes, remove from other options
    if (!this.poll.allowMultiple) {
      this.poll.options.forEach((opt, index) => {
        if (index !== optionIndex) {
          opt.votes = opt.votes.filter(id => id.toString() !== userId.toString());
        }
      });
    }
  } else {
    // Remove vote
    option.votes.splice(existingVote, 1);
  }
  
  return true;
};

// Pre-save middleware to update hive statistics
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const StudyHive = mongoose.model('StudyHive');
      await StudyHive.findByIdAndUpdate(
        this.hive,
        { 
          $inc: { 'statistics.totalMessages': 1 },
          $set: { lastActivity: new Date() }
        }
      );
    } catch (error) {
      console.error('Error updating hive message count:', error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Message', messageSchema);
