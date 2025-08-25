const Message = require('../models/Message');
const StudyHive = require('../models/StudyHive');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx|xls|xlsx|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and common file types are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

// @desc    Get messages for a hive
// @route   GET /api/messages/hive/:hiveId
// @access  Private (Member only)
const getMessages = async (req, res) => {
  try {
    const { hiveId } = req.params;
    const {
      page = 1,
      limit = 50,
      search = '',
      messageType = '',
      author = '',
      pinned = false
    } = req.query;

    // Check if hive exists and user is member
    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to view messages'
      });
    }

    // Build query
    let query = { 
      hive: hiveId, 
      isDeleted: false 
    };

    // Search in message content
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    // Filter by message type
    if (messageType) {
      query.messageType = messageType;
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Filter pinned messages
    if (pinned === 'true') {
      query.isPinned = true;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get messages
    const messages = await Message.find(query)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar gamification.level')
      .populate('replyTo', 'content author createdAt')
      .populate('mentions', 'username profile.firstName profile.lastName')
      .populate('reactions.users', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Message.countDocuments(query);

    // Mark messages as read by the current user
    const unreadMessages = messages.filter(msg => 
      !msg.readBy.some(read => read.user.toString() === req.user.id)
    );

    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map(async msg => {
        msg.markAsRead(req.user.id);
        await msg.save();
      }));
    }

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private (Member only)
const sendMessage = async (req, res) => {
  try {
    const {
      content,
      hiveId,
      messageType = 'text',
      replyTo = null,
      mentions = [],
      poll = null,
      codeLanguage = null
    } = req.body;

    // Validate required fields
    if (!content || !hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Content and hive ID are required'
      });
    }

    // Check if hive exists and user is member
    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to send messages'
      });
    }

    // Validate reply message if replying
    if (replyTo) {
      const parentMessage = await Message.findById(replyTo);
      if (!parentMessage || parentMessage.hive.toString() !== hiveId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reply target'
        });
      }
    }

    // Create message data
    const messageData = {
      content,
      author: req.user.id,
      hive: hiveId,
      messageType,
      replyTo,
      mentions: Array.isArray(mentions) ? mentions : [],
      codeLanguage
    };

    // Add poll data if it's a poll message
    if (messageType === 'poll' && poll) {
      if (!poll.question || !poll.options || poll.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Poll must have a question and at least 2 options'
        });
      }

      messageData.poll = {
        question: poll.question,
        options: poll.options.map(option => ({
          text: option.text || option,
          votes: []
        })),
        allowMultiple: poll.allowMultiple || false,
        expiresAt: poll.expiresAt ? new Date(poll.expiresAt) : null
      };
    }

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date()
      }));
      messageData.messageType = 'file';
    }

    // Create the message
    const message = await Message.create(messageData);

    // Update reply message with this message as a reply
    if (replyTo) {
      await Message.findByIdAndUpdate(replyTo, {
        $push: { replies: message._id }
      });
    }

    // Award points for sending message
    const user = await User.findById(req.user.id);
    user.addPoints(5, 'Sent Message');
    await user.save();

    // Populate message for response
    await message.populate([
      { path: 'author', select: 'username profile.firstName profile.lastName profile.avatar gamification.level' },
      { path: 'replyTo', select: 'content author createdAt' },
      { path: 'mentions', select: 'username profile.firstName profile.lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
// @access  Private (Author only)
const editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if message is too old to edit (24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (message.createdAt < twentyFourHoursAgo) {
      return res.status(400).json({
        success: false,
        message: 'Messages can only be edited within 24 hours of posting'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    // Edit the message
    message.editContent(content.trim());
    await message.save();

    // Populate for response
    await message.populate('author', 'username profile.firstName profile.lastName profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Author, Moderator, or Admin)
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    const hive = await StudyHive.findById(message.hive);
    const isAuthor = message.author.toString() === req.user.id;
    const canModerate = hive && hive.canModerate(req.user.id);

    if (!isAuthor && !canModerate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message'
      });
    }

    // Soft delete the message
    message.softDelete(req.user.id);
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reactions
// @access  Private (Member only)
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is member of the hive
    const hive = await StudyHive.findById(message.hive);
    if (!hive || !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to react to messages'
      });
    }

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    // Add reaction
    message.addReaction(emoji, req.user.id);
    await message.save();

    // Award points for engagement
    const user = await User.findById(req.user.id);
    user.addPoints(2, 'Message Reaction');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Pin/unpin a message
// @route   PUT /api/messages/:id/pin
// @access  Private (Moderator/Admin only)
const togglePin = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can moderate the hive
    const hive = await StudyHive.findById(message.hive);
    if (!hive || !hive.canModerate(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to pin messages in this hive'
      });
    }

    // Toggle pin status
    message.togglePin(req.user.id);
    await message.save();

    res.status(200).json({
      success: true,
      message: `Message ${message.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: { isPinned: message.isPinned }
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Vote on a poll
// @route   POST /api/messages/:id/poll/vote
// @access  Private (Member only)
const voteOnPoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.messageType !== 'poll') {
      return res.status(400).json({
        success: false,
        message: 'This message is not a poll'
      });
    }

    // Check if poll has expired
    if (message.poll.expiresAt && new Date() > message.poll.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This poll has expired'
      });
    }

    // Check if user is member of the hive
    const hive = await StudyHive.findById(message.hive);
    if (!hive || !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to vote on polls'
      });
    }

    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= message.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid poll option'
      });
    }

    // Add vote
    const voteSuccess = message.addPollVote(optionIndex, req.user.id);
    if (!voteSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Failed to register vote'
      });
    }

    await message.save();

    // Award points for voting
    const user = await User.findById(req.user.id);
    user.addPoints(3, 'Poll Vote');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vote registered successfully',
      data: { poll: message.poll }
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
const searchMessages = async (req, res) => {
  try {
    const {
      q = '',
      hiveId = '',
      author = '',
      messageType = '',
      dateFrom = '',
      dateTo = '',
      page = 1,
      limit = 20
    } = req.query;

    if (!q && !hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Search query or hive ID is required'
      });
    }

    // Build query
    let query = { isDeleted: false };

    // Search in content
    if (q) {
      query.content = { $regex: q, $options: 'i' };
    }

    // Filter by hive
    if (hiveId) {
      // Check if user is member of the hive
      const hive = await StudyHive.findById(hiveId);
      if (!hive || !hive.isMember(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to search messages in this hive'
        });
      }
      query.hive = hiveId;
    } else {
      // Search across user's hives only
      const user = await User.findById(req.user.id);
      const userHiveIds = user.hives.map(hive => hive.hiveId);
      query.hive = { $in: userHiveIds };
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Filter by message type
    if (messageType) {
      query.messageType = messageType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute search
    const messages = await Message.find(query)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('hive', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get message thread (replies)
// @route   GET /api/messages/:id/thread
// @access  Private (Member only)
const getMessageThread = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('replies');

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is member of the hive
    const hive = await StudyHive.findById(message.hive);
    if (!hive || !hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this message thread'
      });
    }

    // Get all replies with full population
    const replies = await Message.find({ _id: { $in: message.replies } })
      .populate('author', 'username profile.firstName profile.lastName profile.avatar gamification.level')
      .populate('mentions', 'username profile.firstName profile.lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        parentMessage: message,
        replies
      }
    });
  } catch (error) {
    console.error('Error fetching message thread:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get pinned messages for a hive
// @route   GET /api/messages/hive/:hiveId/pinned
// @access  Private (Member only)
const getPinnedMessages = async (req, res) => {
  try {
    const { hiveId } = req.params;

    // Check if hive exists and user is member
    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to view pinned messages'
      });
    }

    const pinnedMessages = await Message.find({
      hive: hiveId,
      isPinned: true,
      isDeleted: false
    })
      .populate('author', 'username profile.firstName profile.lastName profile.avatar')
      .populate('pinnedBy', 'username profile.firstName profile.lastName')
      .sort({ pinnedAt: -1 });

    res.status(200).json({
      success: true,
      data: pinnedMessages
    });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get message statistics for a hive
// @route   GET /api/messages/hive/:hiveId/stats
// @access  Private (Member only)
const getMessageStats = async (req, res) => {
  try {
    const { hiveId } = req.params;
    const { period = '7d' } = req.query; // '1d', '7d', '30d', 'all'

    // Check if hive exists and user is member
    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Study hive not found'
      });
    }

    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this hive to view message statistics'
      });
    }

    // Calculate date range
    let dateFilter = {};
    if (period !== 'all') {
      const days = period === '1d' ? 1 : period === '7d' ? 7 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: startDate };
    }

    // Base query
    const baseQuery = { hive: hiveId, isDeleted: false, ...dateFilter };

    // Get statistics
    const [
      totalMessages,
      messagesByType,
      topAuthors,
      messagesWithReactions,
      messagesWithReplies
    ] = await Promise.all([
      Message.countDocuments(baseQuery),
      Message.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$messageType', count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$author', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'author'
          }
        },
        { $unwind: '$author' },
        {
          $project: {
            count: 1,
            'author.username': 1,
            'author.profile.firstName': 1,
            'author.profile.lastName': 1
          }
        }
      ]),
      Message.countDocuments({
        ...baseQuery,
        'reactions.0': { $exists: true }
      }),
      Message.countDocuments({
        ...baseQuery,
        'replies.0': { $exists: true }
      })
    ]);

    const stats = {
      totalMessages,
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topAuthors,
      engagementStats: {
        messagesWithReactions,
        messagesWithReplies,
        engagementRate: totalMessages > 0 ? 
          ((messagesWithReactions + messagesWithReplies) / totalMessages * 100).toFixed(2) : 0
      },
      period
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload file for message
// @route   POST /api/messages/upload
// @access  Private
const uploadFile = upload.array('files', 5); // Allow up to 5 files

// @desc    Get unread message count for user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const { hiveId = '' } = req.query;

    let query = {
      isDeleted: false,
      'readBy.user': { $ne: req.user.id }
    };

    // Filter by specific hive or all user's hives
    if (hiveId) {
      // Check if user is member of the hive
      const hive = await StudyHive.findById(hiveId);
      if (!hive || !hive.isMember(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this hive'
        });
      }
      query.hive = hiveId;
    } else {
      // Get unread across all user's hives
      const user = await User.findById(req.user.id);
      const userHiveIds = user.hives.map(hive => hive.hiveId);
      query.hive = { $in: userHiveIds };
    }

    const unreadCount = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   POST /api/messages/mark-read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds, hiveId } = req.body;

    if (!messageIds && !hiveId) {
      return res.status(400).json({
        success: false,
        message: 'Either messageIds or hiveId is required'
      });
    }

    let query = { isDeleted: false };

    if (messageIds && Array.isArray(messageIds)) {
      query._id = { $in: messageIds };
    } else if (hiveId) {
      // Check if user is member of the hive
      const hive = await StudyHive.findById(hiveId);
      if (!hive || !hive.isMember(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this hive'
        });
      }
      query.hive = hiveId;
    }

    // Find messages that haven't been read by this user
    const messages = await Message.find({
      ...query,
      'readBy.user': { $ne: req.user.id }
    });

    // Mark each message as read
    const updatePromises = messages.map(async message => {
      message.markAsRead(req.user.id);
      return message.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Marked ${messages.length} messages as read`
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  togglePin,
  voteOnPoll,
  searchMessages,
  getMessageThread,
  getPinnedMessages,
  getMessageStats,
  uploadFile,
  getUnreadCount,
  markMessagesAsRead
};
