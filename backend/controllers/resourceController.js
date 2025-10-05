const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');

// Helpers to read limits from env with sensible defaults
function parseIntOrDefault(value, def) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function getAllowedTypes() {
  const raw = process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,png,jpg,jpeg';
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

exports.uploadResource = async (req, res) => {
  try {
    // multer places the file on req.file
    const file = req.file;
    const { hiveId, title, description, subject, tags } = req.body;

    if (!hiveId) {
      // cleanup uploaded file if present
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'hiveId is required' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const allowed = getAllowedTypes();
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (allowed.length && !allowed.includes(ext)) {
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: `File type not allowed. Allowed: ${allowed.join(', ')}` });
    }

    const resourceDoc = new Resource({
      title: title?.trim() || file.originalname,
      description: description?.trim() || '',
      resourceType: 'document',
      content: {
        file: {
          fileName: file.originalname,
          filePath: path.join('uploads', 'resources', path.basename(file.path)),
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      },
      author: req.user.id,
      hive: hiveId,
      subject: subject?.trim() || 'general',
      tags: (typeof tags === 'string' ? tags.split(',') : Array.isArray(tags) ? tags : []).map(t => String(t).trim()).filter(Boolean),
      category: 'Reference Material',
    });

    await resourceDoc.save();

    return res.status(201).json({ success: true, data: resourceDoc });
  } catch (err) {
    console.error('Resource upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

exports.listResources = async (req, res) => {
  try {
    const { hiveId } = req.query;
    const page = parseIntOrDefault(req.query.page, 1);
    const limit = parseIntOrDefault(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (hiveId) filter.hive = hiveId;

    const [items, total] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter)
    ]);

    return res.json({ success: true, data: { items, page, limit, total } });
  } catch (err) {
    console.error('List resources error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch resources' });
  }
};
