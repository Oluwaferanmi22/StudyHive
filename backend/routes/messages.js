const express = require('express');
const router = express.Router();

// Minimal messages routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Messages OK' }));

module.exports = router;
