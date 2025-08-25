const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const {
  getHives,
  getHive,
  createHive,
  joinHive,
  leaveHive,
  updateHive,
  deleteHive,
  getMyHives,
  manageJoinRequest,
  updateMemberRole,
  removeMember,
  createAnnouncement,
  getHiveMembers,
  getHiveStats,
  searchHives,
  getJoinRequests
} = require('../controllers/hiveController');

// Validation middleware
const validateCreateHive = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Hive name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('settings.maxMembers')
    .optional()
    .isInt({ min: 2, max: 200 })
    .withMessage('Max members must be between 2 and 200')
];

const validateUpdateHive = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Hive name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters')
];

const validateAnnouncement = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters')
];

const validateMemberRole = [
  body('role')
    .isIn(['member', 'moderator', 'admin'])
    .withMessage('Role must be member, moderator, or admin')
];

const validateJoinRequest = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject')
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

// @route   GET /api/hives/search
// @desc    Search study hives
// @access  Private
router.get('/search', protect, searchHives);

// @route   GET /api/hives/my-hives
// @desc    Get user's study hives
// @access  Private
router.get('/my-hives', protect, getMyHives);

// @route   GET /api/hives
// @desc    Get all study hives (with filtering)
// @access  Private
router.get('/', protect, getHives);

// @route   POST /api/hives
// @desc    Create a new study hive
// @access  Private
router.post('/', protect, validateCreateHive, handleValidationErrors, createHive);

// @route   GET /api/hives/:id
// @desc    Get study hive by ID
// @access  Private
router.get('/:id', protect, getHive);

// @route   PUT /api/hives/:id
// @desc    Update study hive
// @access  Private (Admin/Creator only)
router.put('/:id', protect, validateUpdateHive, handleValidationErrors, updateHive);

// @route   DELETE /api/hives/:id
// @desc    Delete study hive
// @access  Private (Creator only)
router.delete('/:id', protect, deleteHive);

// @route   POST /api/hives/:id/join
// @desc    Join a study hive
// @access  Private
router.post('/:id/join', protect, joinHive);

// @route   POST /api/hives/:id/leave
// @desc    Leave a study hive
// @access  Private
router.post('/:id/leave', protect, leaveHive);

// @route   GET /api/hives/:id/members
// @desc    Get hive members
// @access  Private (Member only)
router.get('/:id/members', protect, getHiveMembers);

// @route   PUT /api/hives/:id/members/:memberId
// @desc    Update member role
// @access  Private (Admin only)
router.put('/:id/members/:memberId', protect, validateMemberRole, handleValidationErrors, updateMemberRole);

// @route   DELETE /api/hives/:id/members/:memberId
// @desc    Remove member from hive
// @access  Private (Admin/Moderator only)
router.delete('/:id/members/:memberId', protect, removeMember);

// @route   GET /api/hives/:id/stats
// @desc    Get hive statistics
// @access  Private (Member only)
router.get('/:id/stats', protect, getHiveStats);

// @route   POST /api/hives/:id/announcements
// @desc    Create hive announcement
// @access  Private (Admin/Moderator only)
router.post('/:id/announcements', protect, validateAnnouncement, handleValidationErrors, createAnnouncement);

// @route   GET /api/hives/:id/join-requests
// @desc    Get join requests for a hive
// @access  Private (Admin/Moderator only)
router.get('/:id/join-requests', protect, getJoinRequests);

// @route   POST /api/hives/:id/join-requests/:requestId
// @desc    Manage join request (approve/reject)
// @access  Private (Admin/Moderator only)
router.post('/:id/join-requests/:requestId', protect, validateJoinRequest, handleValidationErrors, manageJoinRequest);

module.exports = router;
