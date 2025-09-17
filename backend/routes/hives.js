const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
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
  getJoinRequests,
  generateShareableLink,
  updateShareableLinkSettings,
  disableShareableLink,
  joinHiveByLink
} = require('../controllers/hiveController');

// Validation middleware (simplified for this route file)
const validateCreateHive = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Hive name must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('subject').trim().isLength({ min: 2, max: 50 }).withMessage('Subject must be between 2 and 50 characters'),
  body('settings.maxMembers').optional().isInt({ min: 2, max: 200 }).withMessage('Max members must be between 2 and 200')
];

const validateUpdateHive = [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Hive name must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('subject').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Subject must be between 2 and 50 characters')
];

const validateAnnouncement = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('content').trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be between 10 and 2000 characters')
];

const validateMemberRole = [
  body('role').isIn(['member', 'moderator', 'admin']).withMessage('Role must be member, moderator, or admin')
];

const validateJoinRequest = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
];

const { validationResult } = require('express-validator');
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// Routes
router.get('/search', protect, searchHives);
router.get('/my-hives', protect, getMyHives);
router.get('/', protect, getHives);
router.post('/', protect, validateCreateHive, handleValidationErrors, createHive);
router.get('/:id', protect, getHive);
router.put('/:id', protect, validateUpdateHive, handleValidationErrors, updateHive);
router.delete('/:id', protect, deleteHive);
router.post('/:id/join', protect, joinHive);
router.post('/:id/leave', protect, leaveHive);
router.get('/:id/members', protect, getHiveMembers);
router.put('/:id/members/:memberId', protect, validateMemberRole, handleValidationErrors, updateMemberRole);
router.delete('/:id/members/:memberId', protect, removeMember);
router.get('/:id/stats', protect, getHiveStats);
router.post('/:id/announcements', protect, validateAnnouncement, handleValidationErrors, createAnnouncement);
router.get('/:id/join-requests', protect, getJoinRequests);
router.post('/:id/join-requests/:requestId', protect, validateJoinRequest, handleValidationErrors, manageJoinRequest);
router.post('/:id/share-link', protect, generateShareableLink);
router.put('/:id/share-link/settings', protect, updateShareableLinkSettings);
router.delete('/:id/share-link', protect, disableShareableLink);
router.post('/join/:linkId', joinHiveByLink);

module.exports = router;
