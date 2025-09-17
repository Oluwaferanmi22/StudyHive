const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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

// Health check (optional)
router.get('/health', (req, res) => res.json({ success: true, message: 'Messages OK' }));

// List and search
router.get('/search', protect, searchMessages);
router.get('/hive/:hiveId', protect, getMessages);
router.get('/hive/:hiveId/pinned', protect, getPinnedMessages);
router.get('/hive/:hiveId/stats', protect, getMessageStats);

// Threads
router.get('/:id/thread', protect, getMessageThread);

// CRUD
router.post('/', protect, sendMessage);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);

// Reactions and pinning
router.post('/:id/reactions', protect, addReaction);
router.put('/:id/pin', protect, togglePin);

// Polls
router.post('/:id/poll/vote', protect, voteOnPoll);

// Uploads
// Multiple files (images/attachments)
router.post('/upload', protect, uploadFile, (req, res) => {
  const files = (req.files || []).map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    filename: f.filename,
    mimetype: f.mimetype,
    size: f.size,
    path: f.path,
  }));
  return res.status(200).json({ success: true, data: { files } });
});

// Single file (e.g., voice note or single image)
router.post('/upload/single', protect, uploadSingleFile, (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ success: false, message: 'No file uploaded' });
  return res.status(200).json({ success: true, data: {
    fieldname: f.fieldname,
    originalname: f.originalname,
    filename: f.filename,
    mimetype: f.mimetype,
    size: f.size,
    path: f.path,
  }});
});

// Read/unread
router.get('/unread-count', protect, getUnreadCount);
router.post('/mark-read', protect, markMessagesAsRead);

module.exports = router;
