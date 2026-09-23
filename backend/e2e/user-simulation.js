/**
 * User Simulation Script
 * Simulates actual user interactions with the deployed CSCM system
 * Tests core functionality end-to-end with proper business workflows
 */

const https = require('https');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const AIML_URL = process.env.AI_ML_API_URL || 'http://localhost:8000';

function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

class UserSimulation {
  constructor(userType, userId) {
    this.userType = userType;
    this.userId = userId;
    this.actions = [];
    this.token = null;
  }

  logAction(action, result) {
    const timestamp = new Date().toISOString();
    this.actions.push({ timestamp, action, result });
    console.log(`[${timestamp}] ${this.userType} (${this.userId}): ${action}`);
    console.log(`   Result:`, JSON.stringify(result, null, 2));
  }

  async getHealth() {
    try {
      const response = await makeRequest(`${GATEWAY_URL}/health`);
      this.logAction('Health Check', { status: response.status, healthy: response.status === 200 });
      return response.status === 200;
    } catch (error) {
      this.logAction('Health Check', { error: error.message });
      return false;
    }
  }

  async register(username, email, password, role = 'user') {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/auth/register`, 'POST', {
        username,
        email,
        password,
        role
      });
      this.logAction(`Register user ${username}`, { status: response.status });
      if (response.status === 201 && response.data.success) {
        this.token = response.data.data.token;
      }
      return response;
    } catch (error) {
      this.logAction(`Register user ${username}`, { error: error.message });
      return null;
    }
  }

  async login(username, password) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, 'POST', {
        username,
        password
      });
      this.logAction(`Login user ${username}`, { status: response.status });
      if (response.status === 200 && response.data.success) {
        this.token = response.data.data.token;
      }
      return response;
    } catch (error) {
      this.logAction(`Login user ${username}`, { error: error.message });
      return null;
    }
  }

  getAuthHeaders() {
    if (this.token) {
      return { 'Authorization': `Bearer ${this.token}` };
    }
    return {};
  }
}

class ShopkeeperUser extends UserSimulation {
  constructor(storeId) {
    super('Shopkeeper', storeId);
    this.storeId = storeId;
  }

  async viewDashboard() {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/inventory?store_id=${this.storeId}`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Dashboard', { 
        status: response.status, 
        inventoryCount: Array.isArray(response.data) ? response.data.length : 0 
      });
      return response;
    } catch (error) {
      this.logAction('View Dashboard', { error: error.message });
      return null;
    }
  }

  async checkInventory(productId) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/inventory?store_id=${this.storeId}`, 'GET', null, this.getAuthHeaders());
      this.logAction(`Check Inventory for ${productId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Check Inventory for ${productId}`, { error: error.message });
      return null;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/orders`, 'POST', {
        ...orderData,
        store_id: this.storeId
      }, this.getAuthHeaders());
      this.logAction(`Create Order ${orderData.order_id}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Create Order ${orderData.order_id}`, { error: error.message });
      return null;
    }
  }

  async trackOrder(orderId) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/orders/${orderId}`, 'GET', null, this.getAuthHeaders());
      this.logAction(`Track Order ${orderId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Track Order ${orderId}`, { error: error.message });
      return null;
    }
  }

  async checkShipment(shipmentId) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/shipments/${shipmentId}`, 'GET', null, this.getAuthHeaders());
      this.logAction(`Check Shipment ${shipmentId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Check Shipment ${shipmentId}`, { error: error.message });
      return null;
    }
  }

  async createShipment(shipmentData) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/shipments`, 'POST', shipmentData, this.getAuthHeaders());
      this.logAction(`Create Shipment ${shipmentData.shipment_id}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Create Shipment ${shipmentData.shipment_id}`, { error: error.message });
      return null;
    }
  }

  async getDemandForecast(productId) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/demand/forecast`, 'POST', {
        product_id: productId,
        store_id: this.storeId,
        forecast_horizon: 7
      }, this.getAuthHeaders());
      this.logAction(`Get Demand Forecast for ${productId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Get Demand Forecast for ${productId}`, { error: error.message });
      return null;
    }
  }
}

class TransporterUser extends UserSimulation {
  constructor(transporterId) {
    super('Transporter', transporterId);
    this.transporterId = transporterId;
  }

  async viewDashboard() {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/shipments?status=in_transit`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Dashboard (Active Deliveries)', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('View Dashboard', { error: error.message });
      return null;
    }
  }

  async viewTasks() {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/shipments?status=pending`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Tasks (Pending Deliveries)', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('View Tasks', { error: error.message });
      return null;
    }
  }

  async updateShipmentStatus(shipmentId, status) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/shipments/${shipmentId}/status`, 'PATCH', {
        status: status
      }, this.getAuthHeaders());
      this.logAction(`Update Shipment ${shipmentId} to ${status}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Update Shipment ${shipmentId}`, { error: error.message });
      return null;
    }
  }

  async getRouteOptimization(fromLocation, toLocation) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/routing/optimize`, 'POST', {
        from_location: fromLocation,
        to_location: toLocation
      }, this.getAuthHeaders());
      this.logAction(`Get Route Optimization (${fromLocation} → ${toLocation})`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Get Route Optimization`, { error: error.message });
      return null;
    }
  }

  async calculateETA(shipmentId) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/routing/eta`, 'POST', {
        shipment_id: shipmentId
      }, this.getAuthHeaders());
      this.logAction(`Calculate ETA for ${shipmentId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Calculate ETA`, { error: error.message });
      return null;
    }
  }
}

class WholesalerUser extends UserSimulation {
  constructor(wholesalerId) {
    super('Wholesaler', wholesalerId);
    this.wholesalerId = wholesalerId;
  }

  async viewDashboard() {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/orders?status=processing`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Dashboard (Processing Orders)', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('View Dashboard', { error: error.message });
      return null;
    }
  }

  async viewWarehouseInventory(warehouseId) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/inventory?store_id=${warehouseId}`, 'GET', null, this.getAuthHeaders());
      this.logAction(`View Warehouse Inventory for ${warehouseId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`View Warehouse Inventory`, { error: error.message });
      return null;
    }
  }

  async createPurchaseOrder(orderData) {
    try {
      const response = await makeRequest(`${BACKEND_URL}/api/v1/orders`, 'POST', {
        ...orderData,
        store_id: this.wholesalerId
      }, this.getAuthHeaders());
      this.logAction(`Create Purchase Order ${orderData.order_id}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Create Purchase Order`, { error: error.message });
      return null;
    }
  }

  async assessSupplierRisk(supplierId) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/supplier/risk`, 'POST', {
        supplier_id: supplierId
      }, this.getAuthHeaders());
      this.logAction(`Assess Supplier Risk for ${supplierId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Assess Supplier Risk`, { error: error.message });
      return null;
    }
  }

  async optimizeBatch(warehouseId) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/inventory/optimize`, 'POST', {
        store_id: warehouseId,
        optimization_type: 'batch'
      }, this.getAuthHeaders());
      this.logAction(`Optimize Batch for ${warehouseId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Optimize Batch`, { error: error.message });
      return null;
    }
  }
}

class MeshConsoleUser extends UserSimulation {
  constructor(adminId) {
    super('Mesh Console', adminId);
    this.adminId = adminId;
  }

  async viewAlerts() {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/anomaly/alerts`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Centralized Alerts', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('View Alerts', { error: error.message });
      return null;
    }
  }

  async queryKnowledgeGraph(entity) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/kg/query`, 'POST', {
        entity: entity
      }, this.getAuthHeaders());
      this.logAction(`Query Knowledge Graph for ${entity}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Query Knowledge Graph`, { error: error.message });
      return null;
    }
  }

  async checkModelDrift() {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/monitoring/drift`, 'GET', null, this.getAuthHeaders());
      this.logAction('Check Model Drift', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('Check Model Drift', { error: error.message });
      return null;
    }
  }

  async viewSupplyNetwork() {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/simulation/network`, 'GET', null, this.getAuthHeaders());
      this.logAction('View Supply Network Topology', { status: response.status });
      return response;
    } catch (error) {
      this.logAction('View Supply Network', { error: error.message });
      return null;
    }
  }

  async acknowledgeAlert(alertId) {
    try {
      const response = await makeRequest(`${AIML_URL}/api/v1/anomaly/alerts/${alertId}`, 'PUT', {
        acknowledged: true
      }, this.getAuthHeaders());
      this.logAction(`Acknowledge Alert ${alertId}`, { status: response.status });
      return response;
    } catch (error) {
      this.logAction(`Acknowledge Alert`, { error: error.message });
      return null;
    }
  }
}

async function runCrossRoleWorkflow() {
  console.log('\n=== Cross-Role Workflow Simulation ===\n');

  const results = {
    workflow: 'Order-to-Delivery',
    steps: []
  };

  // Initialize and authenticate users
  const shopkeeper = new ShopkeeperUser('STORE001');
  await shopkeeper.register('shopkeeper001', 'shopkeeper001@cscm.com', 'Shopkeeper123!', 'shopkeeper');
  if (!shopkeeper.token) {
    await shopkeeper.login('shopkeeper001', 'Shopkeeper123!');
  }

  const wholesaler = new WholesalerUser('WAREHOUSE_A');
  await wholesaler.register('wholesaler001', 'wholesaler001@cscm.com', 'Wholesaler123!', 'wholesaler');
  if (!wholesaler.token) {
    await wholesaler.login('wholesaler001', 'Wholesaler123!');
  }

  const transporter = new TransporterUser('TRANS_001');
  await transporter.register('transporter001', 'transporter001@cscm.com', 'Transporter123!', 'transporter');
  if (!transporter.token) {
    await transporter.login('transporter001', 'Transporter123!');
  }

  // Step 1: Shopkeeper creates an order
  console.log('Step 1: Shopkeeper creates order');
  const orderResponse = await shopkeeper.createOrder({
    order_id: 'SIM_ORDER_001',
    customer_id: 'CUST_001',
    total_amount: 150.00,
    status: 'pending'
  });
  results.steps.push({ step: 'Shopkeeper creates order', result: orderResponse });

  // Step 2: Wholesaler processes the order
  console.log('\nStep 2: Wholesaler processes order');
  const processResponse = await wholesaler.createPurchaseOrder({
    order_id: 'SIM_ORDER_001',
    total_amount: 150.00,
    status: 'processing'
  });
  results.steps.push({ step: 'Wholesaler processes order', result: processResponse });

  // Step 3: Wholesaler creates shipment
  console.log('\nStep 3: Wholesaler creates shipment');
  const shipmentResponse = await shopkeeper.createShipment({
    shipment_id: 'SIM_SHIP_001',
    order_id: 'SIM_ORDER_001',
    from_location: 'WAREHOUSE_A',
    to_location: 'STORE001',
    status: 'pending'
  });
  results.steps.push({ step: 'Wholesaler creates shipment', result: shipmentResponse });

  // Step 4: Transporter accepts delivery
  console.log('\nStep 4: Transporter accepts delivery');
  const acceptResponse = await transporter.updateShipmentStatus('SIM_SHIP_001', 'in_transit');
  results.steps.push({ step: 'Transporter accepts delivery', result: acceptResponse });

  // Step 5: Transporter completes delivery
  console.log('\nStep 5: Transporter completes delivery');
  const completeResponse = await transporter.updateShipmentStatus('SIM_SHIP_001', 'delivered');
  results.steps.push({ step: 'Transporter completes delivery', result: completeResponse });

  // Step 6: Shopkeeper confirms delivery
  console.log('\nStep 6: Shopkeeper confirms delivery');
  const confirmResponse = await shopkeeper.checkShipment('SIM_SHIP_001');
  results.steps.push({ step: 'Shopkeeper confirms delivery', result: confirmResponse });

  return results;
}

async function runUserSimulations() {
  console.log('=== CSCM User Simulation - End-to-End Testing ===');
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`AI/ML URL: ${AIML_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    timestamp: new Date().toISOString(),
    gateway: GATEWAY_URL,
    backend: BACKEND_URL,
    aiml: AIML_URL,
    users: {},
    crossRoleWorkflow: null
  };

  // Simulate Shopkeeper
  console.log('=== Shopkeeper User Simulation ===');
  const shopkeeper = new ShopkeeperUser('STORE001');
  results.users.shopkeeper = {
    userId: 'STORE001',
    actions: shopkeeper.actions
  };

  // Register and login shopkeeper
  await shopkeeper.register('shopkeeper001', 'shopkeeper001@cscm.com', 'Shopkeeper123!', 'shopkeeper');
  if (!shopkeeper.token) {
    await shopkeeper.login('shopkeeper001', 'Shopkeeper123!');
  }

  await shopkeeper.getHealth();
  await shopkeeper.viewDashboard();
  await shopkeeper.checkInventory('PROD001');
  await shopkeeper.getDemandForecast('PROD001');

  // Simulate Transporter
  console.log('\n=== Transporter User Simulation ===');
  const transporter = new TransporterUser('TRANS_001');
  results.users.transporter = {
    userId: 'TRANS_001',
    actions: transporter.actions
  };

  // Register and login transporter
  await transporter.register('transporter001', 'transporter001@cscm.com', 'Transporter123!', 'transporter');
  if (!transporter.token) {
    await transporter.login('transporter001', 'Transporter123!');
  }

  await transporter.getHealth();
  await transporter.viewDashboard();
  await transporter.viewTasks();
  await transporter.getRouteOptimization('WAREHOUSE_A', 'STORE001');

  // Simulate Wholesaler
  console.log('\n=== Wholesaler User Simulation ===');
  const wholesaler = new WholesalerUser('WAREHOUSE_A');
  results.users.wholesaler = {
    userId: 'WAREHOUSE_A',
    actions: wholesaler.actions
  };

  // Register and login wholesaler
  await wholesaler.register('wholesaler001', 'wholesaler001@cscm.com', 'Wholesaler123!', 'wholesaler');
  if (!wholesaler.token) {
    await wholesaler.login('wholesaler001', 'Wholesaler123!');
  }

  await wholesaler.getHealth();
  await wholesaler.viewDashboard();
  await wholesaler.viewWarehouseInventory('WAREHOUSE_A');
  await wholesaler.optimizeBatch('WAREHOUSE_A');

  // Simulate Mesh Console
  console.log('\n=== Mesh Console User Simulation ===');
  const meshConsole = new MeshConsoleUser('ADMIN_001');
  results.users.meshConsole = {
    userId: 'ADMIN_001',
    actions: meshConsole.actions
  };

  // Register and login admin
  await meshConsole.register('admin001', 'admin001@cscm.com', 'Admin123!', 'admin');
  if (!meshConsole.token) {
    await meshConsole.login('admin001', 'Admin123!');
  }

  await meshConsole.getHealth();
  await meshConsole.viewAlerts();
  await meshConsole.checkModelDrift();
  await meshConsole.viewSupplyNetwork();

  // Run cross-role workflow
  console.log('\n=== Cross-Role Workflow ===');
  results.crossRoleWorkflow = await runCrossRoleWorkflow();

  // Print summary
  console.log('\n=== User Simulation Summary ===');
  console.log(JSON.stringify(results, null, 2));

  // Calculate success rate
  const allActions = [
    ...shopkeeper.actions,
    ...transporter.actions,
    ...wholesaler.actions,
    ...meshConsole.actions
  ];
  const successfulActions = allActions.filter(a => !a.result.error && a.result.status < 500);
  const successRate = Math.round((successfulActions.length / allActions.length) * 100);

  console.log(`\n=== Success Rate ===`);
  console.log(`Total Actions: ${allActions.length}`);
  console.log(`Successful: ${successfulActions.length}`);
  console.log(`Success Rate: ${successRate}%`);

  return results;
}

// Run simulation
if (require.main === module) {
  runUserSimulations()
    .then((results) => {
      const allActions = [
        ...results.users.shopkeeper.actions,
        ...results.users.transporter.actions,
        ...results.users.wholesaler.actions,
        ...results.users.meshConsole.actions
      ];
      const successfulActions = allActions.filter(a => !a.result.error && a.result.status < 500);
      const successRate = Math.round((successfulActions.length / allActions.length) * 100);

      console.log(`\n${successRate >= 50 ? '✅' : '⚠️'} User simulation completed with ${successRate}% success rate`);

      if (successRate >= 50) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ User simulation failed:', error);
      process.exit(1);
    });
}

module.exports = { runUserSimulations, ShopkeeperUser, TransporterUser, WholesalerUser, MeshConsoleUser };
