const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
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
  uploadSingleFile,
  getUnreadCount,
  markMessagesAsRead
} = require('../controllers/messageController');

// Validation middleware
const validateSendMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('hiveId')
    .isMongoId()
    .withMessage('Valid hive ID is required'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'image', 'system', 'poll', 'code', 'voice', 'ai'])
    .withMessage('Invalid message type'),
  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array')
];

const validateEditMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
];

const validateReaction = [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required and must be valid')
];

const validatePollVote = [
  body('optionIndex')
    .isInt({ min: 0 })
    .withMessage('Valid option index is required')
];

const validateMarkRead = [
  body()
    .custom((body) => {
      if (!body.messageIds && !body.hiveId) {
        throw new Error('Either messageIds or hiveId is required');
      }
      if (body.messageIds && !Array.isArray(body.messageIds)) {
        throw new Error('messageIds must be an array');
      }
      if (body.hiveId && typeof body.hiveId !== 'string') {
        throw new Error('hiveId must be a string');
      }
      return true;
    })
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', protect, searchMessages);

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', protect, getUnreadCount);

// @route   POST /api/messages/mark-read
// @desc    Mark messages as read
// @access  Private
router.post('/mark-read', protect, validateMarkRead, handleValidationErrors, markMessagesAsRead);

// @route   POST /api/messages/upload
// @desc    Upload files for messages
// @access  Private
router.post('/upload', protect, (req, res, next) => {
  uploadFile(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: req.files
    });
  });
});

// @route   GET /api/messages/hive/:hiveId
// @desc    Get messages for a hive
// @access  Private (Member only)
router.get('/hive/:hiveId', protect, getMessages);

// @route   GET /api/messages/hive/:hiveId/pinned
// @desc    Get pinned messages for a hive
// @access  Private (Member only)
router.get('/hive/:hiveId/pinned', protect, getPinnedMessages);

// @route   GET /api/messages/hive/:hiveId/stats
// @desc    Get message statistics for a hive
// @access  Private (Member only)
router.get('/hive/:hiveId/stats', protect, getMessageStats);

// @route   POST /api/messages
// @desc    Send a message (with optional file upload)
// @access  Private (Member only)
router.post('/', protect, (req, res, next) => {
  // Check if this is a file upload request
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    uploadSingleFile(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  } else {
    next();
  }
}, sendMessage);

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private (Author only)
router.put('/:id', protect, validateEditMessage, handleValidationErrors, editMessage);

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private (Author, Moderator, or Admin)
router.delete('/:id', protect, deleteMessage);

// @route   GET /api/messages/:id/thread
// @desc    Get message thread (replies)
// @access  Private (Member only)
router.get('/:id/thread', protect, getMessageThread);

// @route   POST /api/messages/:id/reactions
// @desc    Add reaction to message
// @access  Private (Member only)
router.post('/:id/reactions', protect, validateReaction, handleValidationErrors, addReaction);

// @route   PUT /api/messages/:id/pin
// @desc    Pin/unpin a message
// @access  Private (Moderator/Admin only)
router.put('/:id/pin', protect, togglePin);

// @route   POST /api/messages/:id/poll/vote
// @desc    Vote on a poll
// @access  Private (Member only)
router.post('/:id/poll/vote', protect, validatePollVote, handleValidationErrors, voteOnPoll);

module.exports = router;
