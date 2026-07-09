const SubAgent = require('../../_base/SubAgent');

class EventGenerator extends SubAgent {
  constructor(agentId, apiService) {
    super('EventGenerator', agentId, apiService);
  }

  async generateDemandSpike(meta = {}) {
    this.log('Generating demand spike event');

    const data = {
      event_type: 'demand_spike',
      store_id: meta.storeId,
      product_id: meta.productId || 'PROD-001',
      magnitude: meta.magnitude || 0.3,
      duration_days: meta.durationDays || 3
    };

    try {
      const result = await this.apiService.demandForecast(data);
      return {
        eventType: 'demand_spike',
        storeId: meta.storeId,
        expectedImpact: result.expected_demand,
        forecast: result,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      this.error('Demand spike generation failed:', err.message);
      return {
        eventType: 'demand_spike',
        storeId: meta.storeId,
        expectedImpact: 100 + Math.round(Math.random() * 200),
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  async generateInventoryUpdate(meta = {}) {
    this.log('Generating inventory update event');

    const data = {
      event_type: 'inventory_update',
      store_id: meta.storeId,
      product_id: meta.productId || 'PROD-001',
      current_stock: meta.currentStock || 100
    };

    try {
      const result = await this.apiService.inventoryOptimization(data);
      return {
        eventType: 'inventory_update',
        storeId: meta.storeId,
        optimalQuantity: result.order_quantity,
        reorderPoint: result.reorder_point,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      this.error('Inventory update generation failed:', err.message);
      return {
        eventType: 'inventory_update',
        storeId: meta.storeId,
        optimalQuantity: 50,
        reorderPoint: 20,
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
  }

  generateGenericEvent(eventType, payload = {}) {
    this.log(`Generating generic event: ${eventType}`);
    return {
      eventType,
      ...payload,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = EventGenerator;
