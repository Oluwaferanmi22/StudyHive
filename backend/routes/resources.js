const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadResource, listResources } = require('../controllers/resourceController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'resources');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage and limits from env
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10 MB default
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, unique + '-' + safeOriginal);
  }
});

function getAllowedExts() {
  const raw = process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,png,jpg,jpeg';
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = getAllowedExts();
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!allowed.length || allowed.includes(ext)) return cb(null, true);
    return cb(new Error(`Invalid file type: .${ext}. Allowed: ${allowed.join(', ')}`));
  }
});

// Health
router.get('/health', (req, res) => res.json({ success: true, message: 'Resources OK' }));

// List resources (by hiveId)
router.get('/', protect, listResources);

// Upload a resource (single file field name: 'file')
router.post('/upload', protect, upload.single('file'), uploadResource);

module.exports = router;
