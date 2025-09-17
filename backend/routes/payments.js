const express = require('express');
const router = express.Router();

// Minimal payments routes stub for server startup
router.get('/health', (req, res) => res.json({ success: true, message: 'Payments OK' }));

module.exports = router;
