/**
 * Wholesaler Sub-Agent
 * Implements wholesaler-specific E2E test workflows
 */

const BaseSubAgent = require('../utils/sub-agent-base');
const testData = require('../config/test-data');

class WholesalerSubAgent extends BaseSubAgent {
  constructor(userId = 'wholesale_test_1') {
    super('wholesaler', userId);
    this.wholesalerId = userId;
  }

  /**
   * Load wholesaler-specific data
   */
  async loadRoleSpecificData() {
    try {
      // Load orders
      const orders = await this.apiClient.gatewayGet(`/api/v1/orders/store/${this.wholesalerId}`);
      this.state.orders = orders.data;
      
      // Load inventory for warehouses
      const warehouses = testData.wholesalers[0].warehouses;
      this.state.warehouses = warehouses;
      
      for (const warehouse of warehouses) {
        const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${warehouse}`);
        if (!this.state.inventory) {
          this.state.inventory = {};
        }
        this.state.inventory[warehouse] = inventory.data;
      }
    } catch (error) {
      console.log('No existing wholesaler data, using test fixtures');
      this.state.orders = testData.orders;
      this.state.warehouses = testData.wholesalers[0].warehouses;
      this.state.inventory = {};
    }
  }

  /**
   * Test 1: Dashboard Workflow
   */
  async testDashboardWorkflow() {
    console.log('Testing wholesaler dashboard workflow');
    
    // Login
    await this.login();
    
    // Load order summaries
    const orders = await this.apiClient.gatewayGet(`/api/v1/orders/store/${this.wholesalerId}`);
    this.validateResponse(orders, ['orders']);
    
    // Load inventory overview
    const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${this.state.warehouses[0]}`);
    this.validateResponse(inventory, ['items']);
    
    // Get supplier recommendations
    const supplierId = testData.suppliers[0].supplier_id;
    const recommendations = await this.apiClient.gatewayGet(
      `/api/v1/supplier/recommendations/${supplierId}`
    );
    this.validateResponse(recommendations, ['recommended', 'confidence']);
    
    console.log('Dashboard workflow test completed');
  }

  /**
   * Test 2: Inventory Management Workflow
   */
  async testInventoryWorkflow() {
    console.log('Testing wholesaler inventory management workflow');
    
    // Load multi-warehouse inventory
    for (const warehouse of this.state.warehouses) {
      const inventory = await this.apiClient.gatewayGet(`/api/v1/inventory/${warehouse}`);
      this.validateResponse(inventory, ['items']);
    }
    
    // Get inventory optimization
    const optData = testData.aiMlTestData.inventoryOptimization;
    const optimization = await this.apiClient.gatewayPost('/api/v1/inventory/optimize', {
      sku_id: optData.sku_id,
      store_id: this.state.warehouses[0],
      current_quantity: optData.current_quantity
    });
    this.validateResponse(optimization, ['reorder_quantity', 'safety_stock']);
    
    // Get batch optimization
    const batchOpt = await this.apiClient.gatewayPost('/api/v1/inventory/batch-optimize', {
      store_ids: this.state.warehouses,
      optimization_objective: 'cost'
    });
    this.validateResponse(batchOpt, ['recommendations', 'total_savings']);
    
    // Create purchase order
    const orderData = {
      store_id: this.state.warehouses[0],
      items: [
        { sku_id: 'SKU_TEST_004', quantity: 100 }
      ]
    };
    
    const order = await this.apiClient.gatewayPost('/api/v1/orders', orderData);
    this.validateResponse(order, ['order_id', 'status']);
    
    console.log('Inventory management workflow test completed');
  }

  /**
   * Test 3: Order Management Workflow
   */
  async testOrderWorkflow() {
    console.log('Testing wholesaler order management workflow');
    
    // Create purchase order
    const orderData = {
      store_id: this.state.warehouses[0],
      items: [
        { sku_id: 'SKU_TEST_004', quantity: 50 }
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
    const orderHistory = await this.apiClient.gatewayGet(`/api/v1/orders/store/${this.wholesalerId}`);
    this.validateResponse(orderHistory, ['orders']);
    
    // Get supplier risk assessment
    const supplierId = testData.suppliers[0].supplier_id;
    const risk = await this.apiClient.gatewayPost('/api/v1/supplier/risk', {
      supplier_id: supplierId
    });
    this.validateResponse(risk, ['risk_score', 'risk_level']);
    
    console.log('Order management workflow test completed');
  }

  /**
   * Test 4: Shipment Tracking Workflow
   */
  async testShipmentWorkflow() {
    console.log('Testing wholesaler shipment tracking workflow');
    
    // Get in-transit shipments
    const inTransit = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
    this.validateResponse(inTransit, ['shipments']);
    
    // Get delivered shipments
    const delivered = await this.apiClient.gatewayGet('/api/v1/shipments/status/delivered');
    this.validateResponse(delivered, ['shipments']);
    
    if (inTransit.data.shipments.length > 0) {
      const shipmentId = inTransit.data.shipments[0].shipment_id;
      
      // Get shipment details
      const shipment = await this.apiClient.gatewayGet(`/api/v1/shipments/${shipmentId}`);
      this.validateResponse(shipment, ['shipment_id', 'status', 'origin', 'destination']);
      
      // Update shipment status
      const statusUpdate = await this.apiClient.gatewayPatch(
        `/api/v1/shipments/${shipmentId}/status`,
        { status: 'delivered' }
      );
      this.validateResponse(statusUpdate, ['shipment_id', 'status']);
    }
    
    // Get shipments by location
    const locationShipments = await this.apiClient.gatewayGet('/api/v1/shipments/location/warehouse_test_1');
    this.validateResponse(locationShipments, ['shipments']);
    
    console.log('Shipment tracking workflow test completed');
  }

  /**
   * Get test methods for wholesaler
   */
  getTestMethods() {
    return [
      'testDashboardWorkflow',
      'testInventoryWorkflow',
      'testOrderWorkflow',
      'testShipmentWorkflow'
    ];
  }
}

module.exports = WholesalerSubAgent;
