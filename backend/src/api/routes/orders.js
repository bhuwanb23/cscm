const express = require('express');
const router = express.Router();
const { create, getById, updateStatus, getByStore } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', create);
router.get('/store/:storeId', getByStore);
router.get('/:orderId', getById);
router.patch('/:orderId/status', updateStatus);

module.exports = router;
