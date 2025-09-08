const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (with filters)
// @access  Private
router.get('/', protect, (req, res) => {
  res.json({ message: 'Users endpoint - Coming soon!' });
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, (req, res) => {
  res.json({ message: 'Get user by ID - Coming soon!' });
});

module.exports = router;

// Avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => cb(null, 'ava-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});

const avatarFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const uploadAvatar = multer({ storage: avatarStorage, fileFilter: avatarFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @route   POST /api/users/avatar
// @desc    Upload/replace profile avatar
// @access  Private
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Avatar file is required' });
    const user = await User.findById(req.user.id);
    user.profile.avatar = req.file.path;
    await user.save();
    res.json({ success: true, message: 'Avatar updated', avatar: req.file.path });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});
