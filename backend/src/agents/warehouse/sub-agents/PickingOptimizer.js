const SubAgent = require('../../_base/SubAgent');

class PickingOptimizer extends SubAgent {
  constructor(warehouseId, apiService) {
    super('PickingOptimizer', `Warehouse-${warehouseId}`, apiService);
    this.warehouseId = warehouseId;
  }

  async optimizePickingQueue(pickingQueue, warehouseLayout, inventory) {
    this.log(`Optimizing picking queue of ${pickingQueue.length} items`);

    if (!pickingQueue || pickingQueue.length === 0) {
      this.warn('Empty picking queue');
      return [];
    }

    const data = {
      warehouse_id: this.warehouseId,
      picking_queue: pickingQueue,
      warehouse_layout: warehouseLayout,
      inventory
    };

    try {
      const result = await this.apiService.routingOptimization(data);
      return result.optimized_picking_sequence || pickingQueue;
    } catch (err) {
      this.error('Picking optimization failed:', err.message);
      return this._fallbackOptimize(pickingQueue);
    }
  }

  async generateRoute(pickingTask, warehouseLayout) {
    this.log(`Generating picking route for task`);

    const data = {
      warehouse_id: this.warehouseId,
      picking_task: pickingTask,
      warehouse_layout: warehouseLayout
    };

    try {
      const result = await this.apiService.routingOptimization(data);
      return result.picking_route;
    } catch (err) {
      this.error('Route generation failed:', err.message);
      return null;
    }
  }

  _fallbackOptimize(queue) {
    return [...queue].sort((a, b) => {
      const priority = { high: 0, normal: 1, low: 2 };
      return (priority[a.priority] || 1) - (priority[b.priority] || 1);
    });
  }

  estimatePickTime(locationInfo) {
    if (!locationInfo) return 60;
    const baseTime = 30;
    const distanceFactor = locationInfo.distanceFromStart || 0;
    return baseTime + distanceFactor * 2;
  }

  getItemLocation(productId, warehouseLayout) {
    for (const zone of Object.values(warehouseLayout.zones || {})) {
      for (const aisle of Object.values(zone.aisles || {})) {
        if (aisle.products && aisle.products[productId]) {
          return { zone: zone.name, aisle: aisle.name, ...aisle.products[productId] };
        }
      }
    }
    return { zone: 'unknown', aisle: 'unknown', distanceFromStart: 50 };
  }
}

module.exports = PickingOptimizer;
