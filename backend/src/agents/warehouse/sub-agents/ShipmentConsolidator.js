const SubAgent = require('../../_base/SubAgent');

class ShipmentConsolidator extends SubAgent {
  constructor(warehouseId, apiService) {
    super('ShipmentConsolidator', `Warehouse-${warehouseId}`, apiService);
    this.warehouseId = warehouseId;
  }

  checkOpportunities(shipmentId, pickingTask, pendingShipments = {}) {
    this.log(`Checking consolidation for shipment ${shipmentId}`);

    if (!pickingTask || !pickingTask.items) {
      return null;
    }

    const targetDestinations = this._extractDestinations(pickingTask);

    for (const [otherId, other] of Object.entries(pendingShipments)) {
      if (otherId === shipmentId) continue;
      if (other.status !== 'picking' && other.status !== 'packing') continue;

      const otherDestinations = this._extractDestinations(other);

      if (this._isSameDestinationRoute(targetDestinations, otherDestinations)) {
        this.log(`Found consolidation candidate: ${shipmentId} + ${otherId}`);
        return {
          shipmentId: otherId,
          combinedItems: [...(pickingTask.items || []), ...(other.items || [])],
          destination: targetDestinations[0] || otherDestinations[0],
          savings: this._estimateSavings(pickingTask, other)
        };
      }
    }

    return null;
  }

  processConsolidated(consolidationTarget) {
    this.log(`Processing consolidated shipment`);
    return {
      consolidated: true,
      ...consolidationTarget
    };
  }

  _extractDestinations(task) {
    const dest = task.destination;
    return dest ? [dest] : [];
  }

  _isSameDestinationRoute(destsA, destsB) {
    if (destsA.length === 0 || destsB.length === 0) return false;
    return destsA.some(d => destsB.includes(d));
  }

  _estimateSavings(taskA, taskB) {
    const itemsA = (taskA.items || []).length;
    const itemsB = (taskB.items || []).length;
    return {
      pickingTimeSaved: Math.min(itemsA, itemsB) * 15,
      packagingSaved: 1
    };
  }
}

module.exports = ShipmentConsolidator;
