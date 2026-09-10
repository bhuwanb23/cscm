/**
 * Shopkeeper Sub-Agent
 * Implements shopkeeper-specific E2E test workflows
 */

const BaseSubAgent = require('../utils/sub-agent-base');
const testData = require('../config/test-data');

class ShopkeeperSubAgent extends BaseSubAgent {
  constructor(userId = 'shop_test_1') {
    super('shopkeeper', userId);
    this.storeId = userId;
  }

  /**
   * Load shopkeeper-specific data
   */
  async loadRoleSpecificData() {
    try {
      // Load inventory
      const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${this.storeId}`);
      this.state.inventory = inventory.data;
      
      // Load shipments
      const shipments = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
      this.state.shipments = shipments.data;
      
      // Load orders
      const orders = await this.apiClient.gatewayGet(`/api/v1/orders/store/${this.storeId}`);
      this.state.orders = orders.data;
    } catch (error) {
      console.log('No existing shopkeeper data, using test fixtures');
      this.state.inventory = testData.inventory.filter(i => i.store_id === this.storeId);
      this.state.shipments = testData.shipments;
      this.state.orders = testData.orders.filter(o => o.store_id === this.storeId);
    }
  }

  /**
   * Test 1: Dashboard Workflow
   */
  async testDashboardWorkflow() {
    console.log('Testing shopkeeper dashboard workflow');
    
    // Login
    await this.login();
    
    // Load dashboard data
    const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${this.storeId}`);
    this.validateResponse(inventory, ['items']);
    
    const shipments = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
    this.validateResponse(shipments, ['shipments']);
    
    // Get demand forecast
    const forecastData = testData.aiMlTestData.demandForecast;
    const forecast = await this.apiClient.gatewayPost('/api/v1/demand/forecast', {
      sku_id: forecastData.sku_id,
      store_id: forecastData.store_id,
      forecast_horizon: forecastData.forecast_horizon
    });
    this.validateResponse(forecast, ['forecast_values', 'model_version']);
    
    // Get anomaly alerts
    const alerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts');
    this.validateResponse(alerts, ['alerts']);
    
    console.log('Dashboard workflow test completed');
  }

  /**
   * Test 2: Inventory Management Workflow
   */
  async testInventoryWorkflow() {
    console.log('Testing shopkeeper inventory management workflow');
    
    // Get inventory list
    const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${this.storeId}`);
    this.validateResponse(inventory, ['items']);
    
    // Get specific item
    const testSku = testData.inventory[0];
    const item = await this.apiClient.gatewayGet(
      `/api/v1/inventory/${this.storeId}/${testSku.sku_id}`
    );
    this.validateResponse(item, ['sku_id', 'quantity']);
    
    // Create/update inventory item
    const updateData = {
      sku_id: testSku.sku_id,
      store_id: this.storeId,
      quantity: 150
    };
    const updated = await this.apiClient.gatewayPost('/api/v1/inventory', updateData);
    this.validateResponse(updated, ['sku_id', 'quantity']);
    
    // Get inventory optimization recommendations
    const optData = testData.aiMlTestData.inventoryOptimization;
    const optimization = await this.apiClient.gatewayPost('/api/v1/inventory/optimize', {
      sku_id: optData.sku_id,
      store_id: optData.store_id,
      current_quantity: optData.current_quantity
    });
    this.validateResponse(optimization, ['reorder_quantity', 'recommendations']);
    
    // Update quantity
    const quantityUpdate = await this.apiClient.gatewayPut(
      `/api/v1/inventory/${this.storeId}/${testSku.sku_id}/quantity`,
      { quantity: testSku.quantity }
    );
    this.validateResponse(quantityUpdate, ['sku_id', 'quantity']);
    
    console.log('Inventory management workflow test completed');
  }

  /**
   * Test 3: Order Placement Workflow
   */
  async testOrderWorkflow() {
    console.log('Testing shopkeeper order placement workflow');
    
    // Create new order
    const orderData = {
      store_id: this.storeId,
      items: [
        { sku_id: 'SKU_TEST_001', quantity: 10 },
        { sku_id: 'SKU_TEST_002', quantity: 5 }
      ]
    };
    
    const order = await this.apiClient.gatewayPost('/api/v1/orders', orderData);
    this.validateResponse(order, ['order_id', 'status']);
    
    const orderId = order.data.order_id;
    
    // Get order details
    const orderDetails = await this.apiClient.gatewayGet(`/api/v1/orders/${orderId}`);
    this.validateResponse(orderDetails, ['order_id', 'status', 'items']);
    
    // Update order status
    const statusUpdate = await this.apiClient.gatewayPatch(
      `/api/v1/orders/${orderId}/status`,
      { status: 'processing' }
    );
    this.validateResponse(statusUpdate, ['order_id', 'status']);
    
    // Get order history
    const orderHistory = await this.apiClient.gatewayGet(`/api/v1/orders/store/${this.storeId}`);
    this.validateResponse(orderHistory, ['orders']);
    
    // Create shipment for order
    const shipmentData = {
      order_id: orderId,
      origin: 'warehouse_test_1',
      destination: this.storeId,
      items: orderData.items
    };
    
    const shipment = await this.apiClient.gatewayPost('/api/v1/shipments', shipmentData);
    this.validateResponse(shipment, ['shipment_id', 'status']);
    
    console.log('Order placement workflow test completed');
  }

  /**
   * Test 4: Shipment Tracking Workflow
   */
  async testShipmentWorkflow() {
    console.log('Testing shopkeeper shipment tracking workflow');
    
    // Get incoming shipments
    const inTransit = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
    this.validateResponse(inTransit, ['shipments']);
    
    if (inTransit.data.shipments.length > 0) {
      const shipmentId = inTransit.data.shipments[0].shipment_id;
      
      // Get shipment details
      const shipment = await this.apiClient.gatewayGet(`/api/v1/shipments/${shipmentId}`);
      this.validateResponse(shipment, ['shipment_id', 'status', 'origin', 'destination']);
      
      // Update shipment status to delivered
      const delivered = await this.apiClient.gatewayPatch(
        `/api/v1/shipments/${shipmentId}/status`,
        { status: 'delivered' }
      );
      this.validateResponse(delivered, ['shipment_id', 'status']);
      
      // Update inventory on delivery
      const testSku = testData.inventory[0];
      const inventoryUpdate = await this.apiClient.gatewayPut(
        `/api/v1/inventory/${this.storeId}/${testSku.sku_id}/quantity`,
        { quantity: testSku.quantity + 10 }
      );
      this.validateResponse(inventoryUpdate, ['sku_id', 'quantity']);
    }
    
    // Get delivered shipments
    const delivered = await this.apiClient.gatewayGet('/api/v1/shipments/status/delivered');
    this.validateResponse(delivered, ['shipments']);
    
    console.log('Shipment tracking workflow test completed');
  }

  /**
   * Test 5: Analysis Dashboard Workflow
   */
  async testAnalysisWorkflow() {
    console.log('Testing shopkeeper analysis dashboard workflow');
    
    // Get demand forecast
    const forecastData = testData.aiMlTestData.demandForecast;
    const forecast = await this.apiClient.gatewayPost('/api/v1/demand/forecast', {
      sku_id: forecastData.sku_id,
      store_id: forecastData.store_id,
      forecast_horizon: forecastData.forecast_horizon
    });
    this.validateResponse(forecast, ['forecast_values', 'model_version']);
    
    // Get inventory optimization
    const optData = testData.aiMlTestData.inventoryOptimization;
    const optimization = await this.apiClient.gatewayPost('/api/v1/inventory/optimize', {
      sku_id: optData.sku_id,
      store_id: optData.store_id,
      current_quantity: optData.current_quantity
    });
    this.validateResponse(optimization, ['reorder_quantity', 'safety_stock', 'recommendations']);
    
    // Detect anomalies
    const anomalyData = testData.aiMlTestData.anomalyDetection;
    const anomalies = await this.apiClient.gatewayPost('/api/v1/anomaly/detect', {
      data_type: anomalyData.data_type,
      entity_id: anomalyData.entity_id,
      time_range: anomalyData.time_range
    });
    this.validateResponse(anomalies, ['anomalies', 'alerts']);
    
    // Get forecast explainability
    const explainability = await this.apiClient.gatewayPost('/api/v1/explain/forecast', {
      sku_id: forecastData.sku_id,
      store_id: forecastData.store_id
    });
    this.validateResponse(explainability, ['explanations', 'feature_importance']);
    
    // Check model drift
    const drift = await this.apiClient.gatewayPost('/api/v1/monitoring/drift', {
      model_type: 'demand_forecasting'
    });
    this.validateResponse(drift, ['drift_detected', 'drift_score']);
    
    console.log('Analysis dashboard workflow test completed');
  }

  /**
   * Get test methods for shopkeeper
   */
  getTestMethods() {
    return [
      'testDashboardWorkflow',
      'testInventoryWorkflow',
      'testOrderWorkflow',
      'testShipmentWorkflow',
      'testAnalysisWorkflow'
    ];
  }
}

module.exports = ShopkeeperSubAgent;
