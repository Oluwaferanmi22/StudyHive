const express = require('express');
const router = express.Router();

// Minimal resources routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Resources OK' }));

module.exports = router;
