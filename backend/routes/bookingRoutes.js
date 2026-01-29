const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, bookingController.createBooking);

router.get('/my-bookings', protect, bookingController.getMyBookings);
router.delete('/:id', protect, bookingController.deleteBooking);

//admin
router.get('/all', protect, adminOnly, bookingController.getAllBookings);
router.put('/:id/status', protect, adminOnly, bookingController.updateBookingStatus);

module.exports = router;