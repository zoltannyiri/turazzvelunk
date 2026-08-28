const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, notificationController.getMyNotifications);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
