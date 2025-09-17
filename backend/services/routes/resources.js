const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const Resource = require('../models/Resource');
const StudyHive = require('../models/StudyHive');

// Configure multer for PDF uploads to uploads/resources
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resources/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'res-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// @route   GET /api/resources
// @desc    List resources by hive
// @access  Private (Member only)
router.get('/', protect, async (req, res) => {
  try {
    const { hiveId } = req.query;
    if (!hiveId) {
      return res.status(400).json({ success: false, message: 'hiveId is required' });
    }

    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({ success: false, message: 'Study hive not found' });
    }
    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this hive' });
    }

    const resources = await Resource.find({ hive: hiveId, isApproved: true })
      .populate('author', 'username profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: resources });
  } catch (err) {
    console.error('List resources error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/resources/upload
// @desc    Upload a PDF resource to a hive
// @access  Private (Member only)
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { hiveId, title = '', description = '', subject = '', tags = '' } = req.body;
    if (!hiveId) {
      return res.status(400).json({ success: false, message: 'hiveId is required' });
    }
    const hive = await StudyHive.findById(hiveId);
    if (!hive || !hive.isActive) {
      return res.status(404).json({ success: false, message: 'Study hive not found' });
    }
    if (!hive.isMember(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this hive' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const webPath = (req.file.path || '').replace(/\\/g, '/');
    const resource = await Resource.create({
      title: title || req.file.originalname,
      description,
      resourceType: 'document',
      content: {
        file: {
          fileName: req.file.originalname,
          filePath: webPath,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      },
      author: req.user.id,
      hive: hiveId,
      subject: subject || hive.subject,
      tags: typeof tags === 'string' && tags.length ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    });

    await resource.populate('author', 'username profile.firstName profile.lastName');

    res.status(201).json({ success: true, message: 'Resource uploaded', data: resource });
  } catch (err) {
    console.error('Upload resource error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
  }
});

module.exports = router;
