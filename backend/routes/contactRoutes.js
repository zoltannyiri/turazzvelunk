const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const contactController = require('../controllers/contactController');

router.post('/', protect, contactController.sendContactEmail);

module.exports = router;
