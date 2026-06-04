const SubAgent = require('../../_base/SubAgent');

class FleetManager extends SubAgent {
  constructor(transportId, apiService) {
    super('FleetManager', `Transport-${transportId}`, apiService);
    this.transportId = transportId;
  }

  async gnnRoutePlanning(deliveries, vehicles) {
    this.log('Planning routes with GNN');

    if (!deliveries || deliveries.length === 0) throw new Error('deliveries are required');
    if (!vehicles || vehicles.length === 0) throw new Error('vehicles are required');

    const data = { deliveries, vehicles, transport_id: this.transportId };

    try {
      const result = await this.apiService.gnnRoutePlanning(data);
      return result;
    } catch (err) {
      this.error('GNN route planning failed:', err.message);
      return { routes: [], model_version: 'fallback' };
    }
  }

  assignVehicle(delivery, availableVehicles) {
    if (!availableVehicles || availableVehicles.length === 0) return null;

    const suitable = availableVehicles.filter(v =>
      v.status === 'available' && (!delivery.weight || v.capacity >= delivery.weight)
    );

    if (suitable.length === 0) return null;

    suitable.sort((a, b) => (a.lastMaintenance || 0) - (b.lastMaintenance || 0));
    return suitable[0];
  }

  updateVehicleStatus(vehicleId, status, vehicles) {
    if (!vehicles || !vehicles[vehicleId]) return null;

    vehicles[vehicleId] = {
      ...vehicles[vehicleId],
      status,
      lastUpdated: new Date().toISOString()
    };

    return vehicles[vehicleId];
  }

  generateAnalytics(deliveries) {
    const total = deliveries.length;
    const completed = deliveries.filter(d => d.status === 'completed').length;
    const delayed = deliveries.filter(d => d.status === 'delayed').length;

    return {
      totalDeliveries: total,
      completedDeliveries: completed,
      delayedDeliveries: delayed,
      completionRate: total > 0 ? completed / total : 0,
      delayRate: total > 0 ? delayed / total : 0,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FleetManager;
