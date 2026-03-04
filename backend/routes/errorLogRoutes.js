const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const errorLogController = require('../controllers/errorLogController');

router.get('/', protect, adminOnly, errorLogController.listErrors);

module.exports = router;
