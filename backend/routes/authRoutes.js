const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
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
	limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', protect, upload.single('avatar'), authController.updateProfile);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, adminOnly, authController.getAllUsers);
router.put('/users/:id/role', protect, adminOnly, authController.updateUserRole);
router.get('/users/:id', protect, adminOnly, authController.getUserById);
router.get('/users/:id/public', protect, authController.getPublicUserById);

module.exports = router;