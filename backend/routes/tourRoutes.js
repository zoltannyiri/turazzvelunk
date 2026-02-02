const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const tourPostController = require('../controllers/tourPostController');

router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.get('/:tourId/posts', tourPostController.getPostsByTourId);

router.post('/:tourId/posts', protect, adminOnly, tourPostController.createPost);

router.post('/', protect, adminOnly, tourController.createTour);
router.put('/:id', protect, adminOnly, tourController.updateTour);
router.delete('/:id', protect, adminOnly, tourController.deleteTour);

module.exports = router;