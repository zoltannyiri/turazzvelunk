const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminEmailController = require('../controllers/adminEmailController');

router.post('/', protect, adminOnly, adminEmailController.sendAdminEmail);
router.get('/sent', protect, adminOnly, adminEmailController.listSent);
router.get('/inbox', protect, adminOnly, adminEmailController.listInbox);

module.exports = router;
