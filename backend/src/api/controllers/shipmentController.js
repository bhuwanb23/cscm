const ShipmentModel = require('../../models/shipmentModel');
const logger = require('../../utils/logger');

/**
 * Create a new shipment
 * @route POST /api/v1/shipments
 * @group Shipments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Create a new shipment with tracking information
 * @body {string} shipment_id.required - Unique shipment identifier
 * @body {string} order_id - Associated order ID
 * @body {string} from_location.required - Origin location
 * @body {string} to_location.required - Destination location
 * @body {string} status - Shipment status (pending, in_transit, delivered, cancelled)
 * @body {string} carrier - Shipping carrier
 * @body {string} tracking_number - Tracking number
 * @body {string} estimated_delivery - Estimated delivery date
 * @body {Array} items - Array of shipment items
 * @response {201} Shipment created successfully
 * @response {400} Shipment ID, From Location, and To Location are required
 * @response {500} Failed to create shipment
 */
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

/**
 * Get shipment by ID
 * @route GET /api/v1/shipments/:shipmentId
 * @group Shipments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Retrieve a specific shipment by its ID
 * @param {string} shipmentId.path.required - Shipment ID
 * @response {200} Shipment retrieved successfully
 * @response {400} Shipment ID is required
 * @response {404} Shipment not found
 * @response {500} Failed to get shipment
 */
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

/**
 * Update shipment status
 * @route PATCH /api/v1/shipments/:shipmentId/status
 * @group Shipments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Update the status of an existing shipment
 * @param {string} shipmentId.path.required - Shipment ID
 * @body {string} status.required - New shipment status
 * @body {string} actual_delivery - Actual delivery date
 * @response {200} Shipment status updated successfully
 * @response {400} Shipment ID and status are required
 * @response {500} Failed to update shipment status
 */
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

/**
 * Get shipments by status
 * @route GET /api/v1/shipments/status/:status
 * @group Shipments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Retrieve all shipments with a specific status
 * @param {string} status.path.required - Shipment status
 * @response {200} Shipments retrieved successfully
 * @response {400} Status is required
 * @response {500} Failed to get shipments by status
 */
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

/**
 * Get shipments by location
 * @route GET /api/v1/shipments/location/:location
 * @group Shipments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Retrieve all shipments related to a specific location
 * @param {string} location.path.required - Location identifier
 * @response {200} Shipments retrieved successfully
 * @response {400} Location is required
 * @response {500} Failed to get shipments by location
 */
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
