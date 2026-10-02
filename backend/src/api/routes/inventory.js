const express = require('express');
const router = express.Router();
const {
  getByStore,
  getItem,
  upsert,
  updateQuantity,
} = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { requireStoreAccess } = require('../middleware/storeAccess');

router.use(authenticate);

// Authentication is not authorization: every inventory route is store-scoped,
// so each one must also verify the caller owns :storeId. Without this, any
// logged-in shopkeeper could read or rewrite another store's stock levels.
router.get('/:storeId', requireStoreAccess(), getByStore);
router.get('/:storeId/:productId', requireStoreAccess(), getItem);
router.put('/:storeId/:productId/quantity', requireStoreAccess(), updateQuantity);
router.post('/', requireStoreAccess(), upsert);

module.exports = router;
