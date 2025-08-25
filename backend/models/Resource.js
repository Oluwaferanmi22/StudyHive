const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a resource title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  resourceType: {
    type: String,
    enum: ['note', 'document', 'link', 'video', 'audio', 'image', 'presentation'],
    required: [true, 'Please specify the resource type']
  },
  content: {
    // For text-based notes
    text: {
      type: String,
      maxlength: [50000, 'Note content cannot exceed 50000 characters']
    },
    // For file uploads
    file: {
      fileName: String,
      filePath: String,
      fileSize: Number,
      mimeType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    // For external links
    url: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Resource author is required']
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
  category: {
    type: String,
    enum: ['Lecture Notes', 'Study Guide', 'Practice Problems', 'Reference Material', 'Cheat Sheet', 'Tutorial', 'Assignment', 'Other'],
    default: 'Other'
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downloads: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
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
  comments: [{
    user: {
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
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Reply cannot exceed 300 characters']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: Date,
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    content: mongoose.Schema.Types.Mixed,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
resourceSchema.index({ hive: 1, createdAt: -1 });
resourceSchema.index({ author: 1 });
resourceSchema.index({ subject: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ resourceType: 1 });
resourceSchema.index({ difficulty: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ isPinned: 1, hive: 1 });

// Virtual for average rating
resourceSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for total downloads
resourceSchema.virtual('downloadCount').get(function() {
  return this.downloads ? this.downloads.length : 0;
});

// Virtual for total views
resourceSchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

// Virtual for favorite count
resourceSchema.virtual('favoriteCount').get(function() {
  return this.favorites ? this.favorites.length : 0;
});

// Virtual for comment count
resourceSchema.virtual('commentCount').get(function() {
  if (!this.comments) return 0;
  
  return this.comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);
});

// Method to add rating
resourceSchema.methods.addRating = function(userId, rating, review = '') {
  // Check if user already rated
  const existingRatingIndex = this.ratings.findIndex(r => r.user.toString() === userId.toString());
  
  if (existingRatingIndex !== -1) {
    // Update existing rating
    this.ratings[existingRatingIndex].rating = rating;
    this.ratings[existingRatingIndex].review = review;
    this.ratings[existingRatingIndex].ratedAt = new Date();
  } else {
    // Add new rating
    this.ratings.push({
      user: userId,
      rating,
      review,
      ratedAt: new Date()
    });
  }
};

// Method to toggle favorite
resourceSchema.methods.toggleFavorite = function(userId) {
  const favoriteIndex = this.favorites.findIndex(id => id.toString() === userId.toString());
  
  if (favoriteIndex === -1) {
    // Add to favorites
    this.favorites.push(userId);
    return true;
  } else {
    // Remove from favorites
    this.favorites.splice(favoriteIndex, 1);
    return false;
  }
};

// Method to record download
resourceSchema.methods.recordDownload = function(userId, ipAddress = '') {
  this.downloads.push({
    user: userId,
    downloadedAt: new Date(),
    ipAddress
  });
};

// Method to record view
resourceSchema.methods.recordView = function(userId = null, ipAddress = '') {
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

// Method to add comment
resourceSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
    replies: []
  });
  
  return this.comments[this.comments.length - 1];
};

// Method to add reply to comment
resourceSchema.methods.addReply = function(commentId, userId, content) {
  const comment = this.comments.id(commentId);
  
  if (comment) {
    comment.replies.push({
      user: userId,
      content,
      createdAt: new Date()
    });
    
    return comment.replies[comment.replies.length - 1];
  }
  
  return null;
};

// Method to create new version
resourceSchema.methods.createVersion = function(userId, newContent) {
  // Save current version to history
  this.previousVersions.push({
    version: this.version,
    content: {
      text: this.content.text,
      file: this.content.file,
      url: this.content.url
    },
    updatedAt: new Date(),
    updatedBy: userId
  });
  
  // Update to new version
  this.version += 1;
  this.content = newContent;
};

// Method to pin/unpin resource
resourceSchema.methods.togglePin = function(userId) {
  this.isPinned = !this.isPinned;
  
  if (this.isPinned) {
    this.pinnedBy = userId;
    this.pinnedAt = new Date();
  } else {
    this.pinnedBy = null;
    this.pinnedAt = null;
  }
};

// Pre-save middleware to update hive statistics
resourceSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const StudyHive = mongoose.model('StudyHive');
      await StudyHive.findByIdAndUpdate(
        this.hive,
        { 
          $inc: { 'statistics.totalResources': 1 },
          $set: { lastActivity: new Date() }
        }
      );
      
      // Award points to the author
      const User = mongoose.model('User');
      const author = await User.findById(this.author);
      if (author) {
        author.addPoints(10, 'Shared resource');
        await author.save();
      }
    } catch (error) {
      console.error('Error updating hive resource count:', error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
resourceSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Resource', resourceSchema);
