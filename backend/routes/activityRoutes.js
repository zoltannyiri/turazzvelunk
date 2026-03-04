const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const activityController = require('../controllers/activityController');

router.get('/', protect, adminOnly, activityController.listActivity);

module.exports = router;
