const express = require('express');
const router = express.Router();
const errorLogController = require('../controllers/errorLogController');

router.post('/client', errorLogController.logClientError);

module.exports = router;
