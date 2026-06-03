const express = require('express');
const router = express.Router();
const { getByStore, getItem, upsert, updateQuantity } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:storeId', getByStore);
router.get('/:storeId/:productId', getItem);
router.put('/:storeId/:productId/quantity', updateQuantity);
router.post('/', upsert);

module.exports = router;
