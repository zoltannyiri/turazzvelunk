const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const tourPostController = require('../controllers/tourPostController');
const tourChatController = require('../controllers/tourChatController');

router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.get('/equipment-availability/range', tourController.getEquipmentAvailabilityByRange);
router.get('/:id/equipment', tourController.getTourEquipmentOptions);
router.get('/:tourId/posts', tourPostController.getPostsByTourId);
router.get('/:id/chat-messages', protect, tourChatController.getChatMessages);

router.post('/:tourId/posts', protect, adminOnly, tourPostController.createPost);
router.post('/:id/chat-messages', protect, tourChatController.createChatMessage);

router.post('/', protect, adminOnly, tourController.createTour);
router.put('/:id', protect, adminOnly, tourController.updateTour);
router.delete('/:id', protect, adminOnly, tourController.deleteTour);

module.exports = router;