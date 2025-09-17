const express = require('express');
const router = express.Router();

// Minimal users routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Users OK' }));

module.exports = router;
