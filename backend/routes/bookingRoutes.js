const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, bookingController.createBooking);

router.get('/my-bookings', protect, bookingController.getMyBookings);
router.delete('/:id', protect, bookingController.deleteBooking);

router.get('/check/:tourId', protect, bookingController.checkIfBooked);
router.get('/status/:tourId', protect, bookingController.getBookingStatusByTourId);
router.get('/tour/:tourId/participants', protect, bookingController.getTourParticipants);
router.delete('/cancel/:tourId', protect, bookingController.removeBookingByTourId);
router.post('/:id/cancel-request', protect, bookingController.createCancellationRequest);

//admin
router.get('/all', protect, adminOnly, bookingController.getAllBookings);
router.get('/admin/tours/:tourId', protect, adminOnly, bookingController.getBookingsByTourId);
router.get('/admin/users/:userId', protect, adminOnly, bookingController.getBookingsByUserId);
router.put('/:id/status', protect, adminOnly, bookingController.updateBookingStatus);
router.delete('/admin/:id', protect, adminOnly, bookingController.adminDeleteBooking);
router.get('/cancel-requests', protect, adminOnly, bookingController.getCancellationRequests);
router.put('/cancel-requests/:id', protect, adminOnly, bookingController.updateCancellationRequestStatus);

module.exports = router;