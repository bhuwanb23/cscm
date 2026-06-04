const SubAgent = require('../../_base/SubAgent');

class PackingPlanner extends SubAgent {
  constructor(warehouseId, apiService) {
    super('PackingPlanner', `Warehouse-${warehouseId}`, apiService);
    this.warehouseId = warehouseId;
  }

  async generatePlan(pickingTask, packingConfigurations = {}) {
    this.log(`Generating packing plan`);

    if (!pickingTask || !pickingTask.items) {
      throw new Error('pickingTask with items is required');
    }

    const data = {
      warehouse_id: this.warehouseId,
      picking_task: pickingTask,
      packing_configurations: packingConfigurations
    };

    try {
      const result = await this.apiService.inventoryOptimization(data);
      return result.packing_plan || this._fallbackPlan(pickingTask, packingConfigurations);
    } catch (err) {
      this.error('Packing plan failed:', err.message);
      return this._fallbackPlan(pickingTask, packingConfigurations);
    }
  }

  _fallbackPlan(pickingTask, packingConfigurations) {
    const items = pickingTask.items || [];
    return items.map(item => {
      const config = this._getDefaultConfig(item.productId, packingConfigurations);
      return {
        productId: item.productId,
        quantity: item.quantity,
        packagingType: config.packagingType,
        estimatedTime: this._estimateTime(config, item.quantity),
        specialHandling: config.specialHandling || []
      };
    });
  }

  _getDefaultConfig(productId, configurations) {
    return configurations[productId] || {
      packagingType: 'standard_box',
      estimatedTimePerUnit: 30,
      specialHandling: []
    };
  }

  _estimateTime(config, quantity) {
    const baseTime = (config.estimatedTimePerUnit || 30) * quantity;
    return baseTime;
  }
}

module.exports = PackingPlanner;
