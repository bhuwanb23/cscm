/**
 * Wholesaler Behavior Script
 * Simulates realistic wholesaler actions in the CSCM system
 */

const config = require('../config');

/**
 * Wholesaler behavior: Review forecasts, bulk orders, inventory updates
 */
async function wholesalerBehavior(user, simulator) {
  const { probabilities } = config.behavior.probabilities.wholesaler;
  const { stores, skus } = config.testData;

  // Action 1: Review demand forecasts
  if (Math.random() < probabilities.reviewForecasts) {
    const sku = skus[Math.floor(Math.random() * skus.length)];
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    
    const response = await simulator.makeRequest(
      'POST',
      '/api/v1/demand/forecast',
      {
        sku_id: sku,
        store_id: storeId,
        horizon: 14
      },
      null,
      {
        'X-API-Key': config.api.aiMlApiKey
      }
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'review_forecasts',
      endpoint: '/api/v1/demand/forecast',
      result: response.success ? 'success' : 'failed',
      business_context: `Reviewing 14-day demand forecast for ${sku} across multiple stores`
    });

    if (response.success) {
      console.log(`${user.id}: Reviewed forecast for ${sku}`);
    }
  }

  await simulator.randomDelay();

  // Action 2: Create bulk order
  if (Math.random() < probabilities.createBulkOrder) {
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    const orderId = `BULK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const items = [];
    const numItems = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < numItems; i++) {
      items.push({
        order_id: orderId,
        product_id: skus[Math.floor(Math.random() * skus.length)],
        quantity: Math.floor(Math.random() * 100) + 50,
        unit_price: 50 + Math.floor(Math.random() * 200)
      });
    }
    
    const response = await simulator.makeRequest(
      'POST',
      '/api/v1/orders',
      {
        order_id: orderId,
        store_id: storeId,
        status: 'pending',
        items: items
      },
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'create_bulk_order',
      endpoint: '/api/v1/orders',
      result: response.success ? 'success' : 'failed',
      business_context: `Creating bulk order ${orderId} with ${numItems} items for ${storeId}`
    });

    if (response.success) {
      console.log(`${user.id}: Created bulk order ${orderId}`);
    }
  }

  await simulator.randomDelay();

  // Action 3: Update inventory
  if (Math.random() < probabilities.updateInventory) {
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    const sku = skus[Math.floor(Math.random() * skus.length)];
    
    const response = await simulator.makeRequest(
      'PUT',
      '/api/v1/inventory',
      {
        product_id: sku,
        store_id: storeId,
        quantity: Math.floor(Math.random() * 500) + 100,
        minimum_stock: Math.floor(Math.random() * 20) + 10,
        maximum_stock: Math.floor(Math.random() * 1000) + 500,
        unit_cost: 50 + Math.floor(Math.random() * 100),
        selling_price: 100 + Math.floor(Math.random() * 200)
      },
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'update_inventory',
      endpoint: '/api/v1/inventory',
      result: response.success ? 'success' : 'failed',
      business_context: `Updating inventory for ${sku} at ${storeId}`
    });

    if (response.success) {
      console.log(`${user.id}: Updated inventory for ${sku}`);
    }
  }
}

module.exports = wholesalerBehavior;
