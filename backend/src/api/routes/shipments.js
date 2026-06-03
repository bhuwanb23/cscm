const express = require('express');
const router = express.Router();
const { create, getById, updateStatus, getByStatus, getByLocation } = require('../controllers/shipmentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', create);
router.get('/status/:status', getByStatus);
router.get('/location/:location', getByLocation);
router.get('/:shipmentId', getById);
router.patch('/:shipmentId/status', updateStatus);

module.exports = router;
