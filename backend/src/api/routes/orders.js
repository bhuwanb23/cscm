const express = require('express');
const router = express.Router();
const { create, getById, updateStatus, getByStore, checkStoreAccess } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { validateSchema } = require('../middleware/schemaValidator');

router.use(authenticate);

router.post('/', validateSchema('createOrder'), create);
router.get('/store/:storeId', checkStoreAccess, getByStore);
router.get('/:orderId', getById);
router.patch('/:orderId/status', validateSchema('updateOrder'), updateStatus);

module.exports = router;
