const ShipmentModel = require('../../models/shipmentModel');
const logger = require('../../utils/logger');

async function create(req, res) {
  try {
    const { shipment_id, order_id, from_location, to_location, status, carrier, tracking_number, estimated_delivery, items } = req.body;
    if (!shipment_id || !from_location || !to_location) {
      return res.status(400).json({ success: false, error: 'Shipment ID, From Location, and To Location are required' });
    }
    const result = await ShipmentModel.create({ shipment_id, order_id, from_location, to_location, status, carrier, tracking_number, estimated_delivery, items });
    logger.info(`Shipment created: ${shipment_id}`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to create shipment:', error);
    res.status(500).json({ success: false, error: 'Failed to create shipment' });
  }
}

async function getById(req, res) {
  try {
    const { shipmentId } = req.params;
    if (!shipmentId) {
      return res.status(400).json({ success: false, error: 'Shipment ID is required' });
    }
    const shipment = await ShipmentModel.getById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }
    res.json({ success: true, data: shipment });
  } catch (error) {
    logger.error('Failed to get shipment:', error);
    res.status(500).json({ success: false, error: 'Failed to get shipment' });
  }
}

async function updateStatus(req, res) {
  try {
    const { shipmentId } = req.params;
    const { status, actual_delivery } = req.body;
    if (!shipmentId || !status) {
      return res.status(400).json({ success: false, error: 'Shipment ID and status are required' });
    }
    const result = await ShipmentModel.updateStatus(shipmentId, status, { actual_delivery });
    logger.info(`Shipment status updated: ${shipmentId} -> ${status}`);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to update shipment status:', error);
    res.status(500).json({ success: false, error: 'Failed to update shipment status' });
  }
}

async function getByStatus(req, res) {
  try {
    const { status } = req.params;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const shipments = await ShipmentModel.getByStatus(status);
    res.json({ success: true, data: shipments });
  } catch (error) {
    logger.error('Failed to get shipments by status:', error);
    res.status(500).json({ success: false, error: 'Failed to get shipments by status' });
  }
}

async function getByLocation(req, res) {
  try {
    const { location } = req.params;
    if (!location) {
      return res.status(400).json({ success: false, error: 'Location is required' });
    }
    const shipments = await ShipmentModel.getByLocation(location);
    res.json({ success: true, data: shipments });
  } catch (error) {
    logger.error('Failed to get shipments by location:', error);
    res.status(500).json({ success: false, error: 'Failed to get shipments by location' });
  }
}

module.exports = { create, getById, updateStatus, getByStatus, getByLocation };
