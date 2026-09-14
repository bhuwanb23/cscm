/**
 * Shopkeeper Behavior Script
 * Simulates realistic shopkeeper actions in the CSCM system
 */

const config = require('../config');

/**
 * Shopkeeper behavior: Monitor inventory, check forecasts, place orders
 */
async function shopkeeperBehavior(user, simulator) {
  const { probabilities } = config.behavior.probabilities.shopkeeper;
  const { stores, skus } = config.testData;

  // Action 1: Check inventory
  if (Math.random() < probabilities.checkInventory) {
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    const response = await simulator.makeRequest(
      'GET',
      `/api/v1/inventory/store/${storeId}`,
      null,
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'check_inventory',
      endpoint: `/api/v1/inventory/store/${storeId}`,
      result: response.success ? 'success' : 'failed',
      business_context: `Checking inventory levels for store ${storeId}`
    });

    if (response.success) {
      console.log(`${user.id}: Checked inventory for ${storeId}`);
    }
  }

  await simulator.randomDelay();

  // Action 2: Check demand forecast
  if (Math.random() < probabilities.checkForecast) {
    const sku = skus[Math.floor(Math.random() * skus.length)];
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    
    const response = await simulator.makeRequest(
      'POST',
      '/api/v1/demand/forecast',
      {
        sku_id: sku,
        store_id: storeId,
        horizon: 7
      },
      null,
      {
        'X-API-Key': config.api.aiMlApiKey
      }
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'get_forecast',
      endpoint: '/api/v1/demand/forecast',
      result: response.success ? 'success' : 'failed',
      business_context: `Checking demand forecast for ${sku} at ${storeId}`
    });

    if (response.success) {
      console.log(`${user.id}: Got forecast for ${sku}`);
    }
  }

  await simulator.randomDelay();

  // Action 3: Create order if stock is low (simulated)
  if (Math.random() < probabilities.createOrder) {
    const storeId = stores[Math.floor(Math.random() * stores.length)];
    const sku = skus[Math.floor(Math.random() * skus.length)];
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const response = await simulator.makeRequest(
      'POST',
      '/api/v1/orders',
      {
        order_id: orderId,
        store_id: storeId,
        status: 'pending',
        items: [
          {
            order_id: orderId,
            product_id: sku,
            quantity: Math.floor(Math.random() * 10) + 1,
            unit_price: 100 + Math.floor(Math.random() * 500)
          }
        ]
      },
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'create_order',
      endpoint: '/api/v1/orders',
      result: response.success ? 'success' : 'failed',
      business_context: `Creating order ${orderId} for ${sku} at ${storeId}`
    });

    if (response.success) {
      console.log(`${user.id}: Created order ${orderId}`);
    }
  }

  await simulator.randomDelay();

  // Action 4: Check order status
  if (Math.random() < probabilities.checkOrderStatus) {
    const response = await simulator.makeRequest(
      'GET',
      '/api/v1/orders',
      null,
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'check_order_status',
      endpoint: '/api/v1/orders',
      result: response.success ? 'success' : 'failed',
      business_context: 'Checking order status updates'
    });

    if (response.success) {
      console.log(`${user.id}: Checked order status`);
    }
  }
}

module.exports = shopkeeperBehavior;
