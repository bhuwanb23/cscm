/**
 * Transporter Behavior Script
 * Simulates realistic transporter actions in the CSCM system
 */

const config = require('../config');

/**
 * Transporter behavior: Check shipments, accept shipments, update status
 */
async function transporterBehavior(user, simulator) {
  const { probabilities } = config.behavior.probabilities.transporter;
  const { locations } = config.testData;

  // Action 1: Check pending shipments
  if (Math.random() < probabilities.checkShipments) {
    const response = await simulator.makeRequest(
      'GET',
      '/api/v1/shipments/status/pending',
      null,
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'check_shipments',
      endpoint: '/api/v1/shipments/status/pending',
      result: response.success ? 'success' : 'failed',
      business_context: 'Checking for pending shipments to accept'
    });

    if (response.success) {
      console.log(`${user.id}: Checked pending shipments`);
    }
  }

  await simulator.randomDelay();

  // Action 2: Accept new shipment
  if (Math.random() < probabilities.acceptShipment) {
    const fromLocation = locations[Math.floor(Math.random() * locations.length)];
    const toLocation = locations[Math.floor(Math.random() * locations.length)];
    const shipmentId = `SHP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const response = await simulator.makeRequest(
      'POST',
      '/api/v1/shipments',
      {
        shipment_id: shipmentId,
        from_location: fromLocation,
        to_location: toLocation,
        status: 'pending',
        carrier: 'SimTrans Logistics',
        items: [
          {
            shipment_id: shipmentId,
            product_id: 'SKU001',
            quantity: Math.floor(Math.random() * 50) + 10
          }
        ]
      },
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'accept_shipment',
      endpoint: '/api/v1/shipments',
      result: response.success ? 'success' : 'failed',
      business_context: `Accepting shipment ${shipmentId} from ${fromLocation} to ${toLocation}`
    });

    if (response.success) {
      console.log(`${user.id}: Accepted shipment ${shipmentId}`);
    }
  }

  await simulator.randomDelay();

  // Action 3: Update shipment status
  if (Math.random() < probabilities.updateStatus) {
    const statuses = ['in_transit', 'delivered'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const shipmentId = `SHP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const response = await simulator.makeRequest(
      'PATCH',
      `/api/v1/shipments/${shipmentId}/status`,
      {
        status: status,
        actual_delivery: status === 'delivered' ? new Date().toISOString() : null
      },
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'update_status',
      endpoint: `/api/v1/shipments/${shipmentId}/status`,
      result: response.success ? 'success' : 'failed',
      business_context: `Updating shipment ${shipmentId} to ${status}`
    });

    if (response.success) {
      console.log(`${user.id}: Updated shipment ${shipmentId} to ${status}`);
    }
  }
}

module.exports = transporterBehavior;
