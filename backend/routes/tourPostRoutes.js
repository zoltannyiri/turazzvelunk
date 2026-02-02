const express = require('express');
const router = express.Router();
const tourPostController = require('../controllers/tourPostController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/tour/:tourId', tourPostController.getPostsByTourId);
router.post('/tour/:tourId', protect, adminOnly, tourPostController.createPost);

router.get('/:postId/comments', tourPostController.getCommentsByPostId);
router.get('/:postId/comments/top', tourPostController.getTopCommentsByPostId);
router.post('/:postId/comments', protect, tourPostController.createComment);
router.post('/comments/:commentId/likes', protect, tourPostController.toggleCommentLike);

router.post('/:postId/likes', protect, tourPostController.toggleLike);

module.exports = router;
