const express = require('express');
const router = express.Router();

// Minimal questions routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Questions OK' }));

module.exports = router;
