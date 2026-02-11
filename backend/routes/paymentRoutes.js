const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-checkout-session', protect, paymentController.createCheckoutSession);
router.post('/confirm-checkout-session', protect, paymentController.confirmCheckoutSession);

module.exports = router;
