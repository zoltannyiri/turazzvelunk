const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '..', 'uploads', 'blog'));
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, safeName);
	}
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype && file.mimetype.startsWith('image/')) {
		cb(null, true);
	} else {
		cb(new Error('Csak kép feltöltése engedélyezett.'), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/', blogController.getAllPosts);
router.get('/:id', blogController.getPostById);

router.post('/', protect, adminOnly, upload.array('images', 30), blogController.createPost);
router.put('/:id', protect, adminOnly, upload.array('images', 30), blogController.updatePost);
router.delete('/:id', protect, adminOnly, blogController.deletePost);

module.exports = router;
