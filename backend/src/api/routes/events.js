const express = require('express');
const router = express.Router();
const { 
  publishTelemetryEvent,
  publishInventoryEvent,
  publishOrderEvent
} = require('../controllers/eventController');

const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Event publishing routes
router.post('/telemetry', publishTelemetryEvent);
router.post('/inventory', publishInventoryEvent);
router.post('/orders', publishOrderEvent);

module.exports = router;