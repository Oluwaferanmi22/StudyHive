const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

// List notifications (paginated)
router.get('/', protect, ctrl.listNotifications);

// Mark single notification as read
router.post('/:id/read', protect, ctrl.markRead);

// Mark all read
router.post('/read-all', protect, ctrl.markAllRead);

// Clear all
router.delete('/clear', protect, ctrl.clearAll);

module.exports = router;
