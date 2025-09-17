const express = require('express');
const router = express.Router();

// Minimal notifications routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Notifications OK' }));

module.exports = router;
