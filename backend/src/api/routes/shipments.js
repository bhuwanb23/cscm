const express = require('express');
const router = express.Router();
const {
  create,
  getById,
  updateStatus,
  getByStatus,
  getByLocation,
  checkShipmentAccess,
} = require('../controllers/shipmentController');
const { authenticate } = require('../middleware/auth');
const { validateSchema } = require('../middleware/schemaValidator');

router.use(authenticate);

router.post('/', validateSchema('createShipment'), create);
router.get('/status/:status', getByStatus);
router.get('/location/:location', getByLocation);
router.get('/:shipmentId', checkShipmentAccess, getById);
router.patch('/:shipmentId/status', checkShipmentAccess, validateSchema('updateShipment'), updateStatus);

module.exports = router;
