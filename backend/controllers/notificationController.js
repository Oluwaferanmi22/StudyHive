const Notification = require('../models/Notification');

// GET /api/notifications
// Query: page, limit, unreadOnly
exports.listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { user: req.user.id };
    if (unreadOnly) query.read = false;

    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(query)
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('Error listing notifications', e);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    n.read = true;
    await n.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE /api/notifications/clear
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
