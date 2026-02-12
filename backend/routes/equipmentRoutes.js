const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, equipmentController.getAllEquipment);
router.post('/', protect, adminOnly, equipmentController.createEquipment);
router.put('/:id', protect, adminOnly, equipmentController.updateEquipment);
router.delete('/:id', protect, adminOnly, equipmentController.deleteEquipment);

module.exports = router;
