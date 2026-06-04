const SubAgent = require('../../_base/SubAgent');

class WarehouseAssigner extends SubAgent {
  constructor(agentId, apiService) {
    super('WarehouseAssigner', agentId, apiService);
  }

  async assign(storeId, inventory, demand) {
    this.log(`Assigning warehouse for store ${storeId}`);

    if (!storeId) throw new Error('storeId is required');
    if (!inventory) throw new Error('inventory is required');

    const data = {
      store_id: storeId,
      inventory,
      demand
    };

    try {
      const result = await this.apiService.routingOptimization(data);
      return result.assignment || this._fallbackAssignment(inventory);
    } catch (err) {
      this.error('Warehouse assignment failed:', err.message);
      return this._fallbackAssignment(inventory);
    }
  }

  findNearestWarehouse(storeLocation, warehouses) {
    if (!warehouses || warehouses.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const w of warehouses) {
      if (!w.location) continue;
      const dist = this._haversine(storeLocation, w.location);
      if (dist < minDist) {
        minDist = dist;
        nearest = w;
      }
    }

    return nearest;
  }

  _fallbackAssignment(inventory) {
    return {
      warehouseId: 'WAREHOUSE-1',
      distance: 0,
      availableStock: Object.values(inventory || {}).reduce((s, i) => s + (i.quantity || 0), 0),
      fallback: true
    };
  }

  _haversine(p1, p2) {
    if (!p1 || !p2) return Infinity;
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

module.exports = WarehouseAssigner;
