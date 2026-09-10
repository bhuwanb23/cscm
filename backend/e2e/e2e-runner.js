/**
 * Main E2E Test Runner
 * Orchestrates all E2E tests across all user roles and integration scenarios
 */

const ApiClient = require('./config/api-client');
const ShopkeeperSubAgent = require('./utils/shopkeeper-sub-agent');
const TransporterSubAgent = require('./utils/transporter-sub-agent');
const WholesalerSubAgent = require('./utils/wholesaler-sub-agent');
const MeshConsoleSubAgent = require('./utils/mesh-sub-agent');
const config = require('./config/test-config');

class E2ETestRunner {
  constructor() {
    this.apiClient = new ApiClient();
    this.results = [];
    this.startTime = null;
  }

  /**
   * Run all E2E tests
   */
  async runAllTests() {
    console.log('='.repeat(60));
    console.log('Starting CSCM E2E Test Suite');
    console.log('='.repeat(60));
    
    this.startTime = Date.now();
    
    try {
      // Check service health (with timeout and partial success tolerance)
      console.log('\n🔍 Checking service health...');
      const healthCheck = await this.apiClient.checkAllServices();
      
      if (!healthCheck.allHealthy) {
        console.log('⚠️  Not all services are fully healthy, but proceeding with tests...');
        console.log(`  Gateway: ${healthCheck.gateway ? '✓' : '✗'}`);
        console.log(`  Backend: ${healthCheck.backend ? '✓' : '✗'}`);
        console.log(`  AI/ML: ${healthCheck.aiMl ? '✓' : '✗'}`);
      } else {
        console.log('✅ All services are healthy');
      }
      
      // Run role-specific tests
      await this.runRoleTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ E2E test suite failed:', error);
      this.results.push({
        type: 'suite',
        status: 'failed',
        error: error.message
      });
    }
    
    const duration = Date.now() - this.startTime;
    console.log('\n' + '='.repeat(60));
    console.log(`E2E Test Suite completed in ${duration}ms`);
    console.log('='.repeat(60));
    
    return this.results;
  }

  /**
   * Run role-specific tests
   */
  async runRoleTests() {
    console.log('\n📱 Running role-specific tests...');
    
    // Shopkeeper tests
    console.log('\n--- Shopkeeper Tests ---');
    const shopkeeper = new ShopkeeperSubAgent('shop_test_1');
    await shopkeeper.initialize();
    const shopkeeperResults = await shopkeeper.runAllTests();
    await shopkeeper.cleanup();
    this.results.push({ type: 'role', role: 'shopkeeper', ...shopkeeperResults });
    
    // Transporter tests
    console.log('\n--- Transporter Tests ---');
    const transporter = new TransporterSubAgent('transport_test_1');
    await transporter.initialize();
    const transporterResults = await transporter.runAllTests();
    await transporter.cleanup();
    this.results.push({ type: 'role', role: 'transporter', ...transporterResults });
    
    // Wholesaler tests
    console.log('\n--- Wholesaler Tests ---');
    const wholesaler = new WholesalerSubAgent('wholesale_test_1');
    await wholesaler.initialize();
    const wholesalerResults = await wholesaler.runAllTests();
    await wholesaler.cleanup();
    this.results.push({ type: 'role', role: 'wholesaler', ...wholesalerResults });
    
    // Mesh Console tests
    console.log('\n--- Mesh Console Tests ---');
    const mesh = new MeshConsoleSubAgent('mesh_test_1');
    await mesh.initialize();
    const meshResults = await mesh.runAllTests();
    await mesh.cleanup();
    this.results.push({ type: 'role', role: 'mesh', ...meshResults });
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('\n🔗 Running integration tests...');
    
    // Order-to-Delivery workflow
    console.log('\n--- Order-to-Delivery Integration Test ---');
    try {
      await this.testOrderToDeliveryWorkflow();
      this.results.push({
        type: 'integration',
        name: 'order-to-delivery',
        status: 'passed'
      });
    } catch (error) {
      console.error('Order-to-Delivery test failed:', error);
      this.results.push({
        type: 'integration',
        name: 'order-to-delivery',
        status: 'failed',
        error: error.message
      });
    }
    
    // Demand forecasting workflow
    console.log('\n--- Demand Forecasting Integration Test ---');
    try {
      await this.testDemandForecastingWorkflow();
      this.results.push({
        type: 'integration',
        name: 'demand-forecasting',
        status: 'passed'
      });
    } catch (error) {
      console.error('Demand forecasting test failed:', error);
      this.results.push({
        type: 'integration',
        name: 'demand-forecasting',
        status: 'failed',
        error: error.message
      });
    }
    
    // Anomaly detection workflow
    console.log('\n--- Anomaly Detection Integration Test ---');
    try {
      await this.testAnomalyDetectionWorkflow();
      this.results.push({
        type: 'integration',
        name: 'anomaly-detection',
        status: 'passed'
      });
    } catch (error) {
      console.error('Anomaly detection test failed:', error);
      this.results.push({
        type: 'integration',
        name: 'anomaly-detection',
        status: 'failed',
        error: error.message
      });
    }
  }

  /**
   * Test Order-to-Delivery workflow
   */
  async testOrderToDeliveryWorkflow() {
    console.log('Testing order-to-delivery workflow...');
    
    // Step 1: Shopkeeper creates order
    const shopkeeper = new ShopkeeperSubAgent('shop_test_1');
    await shopkeeper.initialize();
    
    const orderData = {
      store_id: 'shop_test_1',
      items: [{ sku_id: 'SKU_TEST_001', quantity: 10 }]
    };
    
    const order = await this.apiClient.gatewayPost('/api/v1/orders', orderData);
    const orderId = order.data.order_id;
    console.log(`  Order created: ${orderId}`);
    
    // Step 2: Wholesaler processes order
    const wholesaler = new WholesalerSubAgent('wholesale_test_1');
    await wholesaler.initialize();
    
    const statusUpdate = await this.apiClient.gatewayPatch(
      `/api/v1/orders/${orderId}/status`,
      { status: 'processing' }
    );
    console.log(`  Order status updated to: ${statusUpdate.data.status}`);
    
    // Step 3: Warehouse creates shipment
    const shipmentData = {
      order_id: orderId,
      origin: 'warehouse_test_1',
      destination: 'shop_test_1',
      items: orderData.items
    };
    
    const shipment = await this.apiClient.gatewayPost('/api/v1/shipments', shipmentData);
    const shipmentId = shipment.data.shipment_id;
    console.log(`  Shipment created: ${shipmentId}`);
    
    // Step 4: Transporter delivers shipment
    const transporter = new TransporterSubAgent('transport_test_1');
    await transporter.initialize();
    
    const delivered = await this.apiClient.gatewayPatch(
      `/api/v1/shipments/${shipmentId}/status`,
      { status: 'delivered' }
    );
    console.log(`  Shipment status updated to: ${delivered.data.status}`);
    
    // Step 5: Shopkeeper updates inventory
    const inventoryUpdate = await this.apiClient.gatewayPut(
      `/api/v1/inventory/shop_test_1/SKU_TEST_001/quantity`,
      { quantity: 110 }
    );
    console.log(`  Inventory updated to: ${inventoryUpdate.data.quantity}`);
    
    // Cleanup
    await shopkeeper.cleanup();
    await wholesaler.cleanup();
    await transporter.cleanup();
    
    console.log('✓ Order-to-delivery workflow test completed');
  }

  /**
   * Test Demand Forecasting workflow
   */
  async testDemandForecastingWorkflow() {
    console.log('Testing demand forecasting workflow...');
    
    // Step 1: Shopkeeper requests forecast
    const forecastData = {
      sku_id: 'SKU_TEST_001',
      store_id: 'shop_test_1',
      forecast_horizon: 30
    };
    
    const forecast = await this.apiClient.gatewayPost('/api/v1/demand/forecast', forecastData);
    console.log(`  Forecast generated for ${forecastData.sku_id}`);
    
    // Step 2: Get batch forecast
    const batchForecast = await this.apiClient.gatewayPost('/api/v1/demand/batch-forecast', {
      sku_ids: ['SKU_TEST_001', 'SKU_TEST_002'],
      store_id: 'shop_test_1'
    });
    console.log(`  Batch forecast job created: ${batchForecast.data.job_id}`);
    
    // Step 3: Central planner coordinates
    const coordination = await this.apiClient.gatewayPost('/api/v1/coordination/plan', {
      plan_type: 'demand_allocation',
      stores: ['shop_test_1', 'shop_test_2']
    });
    console.log(`  Coordination plan created: ${coordination.data.plan_id}`);
    
    // Step 4: Wholesaler uses forecast for inventory
    const optimization = await this.apiClient.gatewayPost('/api/v1/inventory/optimize', {
      sku_id: 'SKU_TEST_001',
      store_id: 'shop_test_1',
      current_quantity: 100
    });
    console.log(`  Inventory optimization completed`);
    
    console.log('✓ Demand forecasting workflow test completed');
  }

  /**
   * Test Anomaly Detection workflow
   */
  async testAnomalyDetectionWorkflow() {
    console.log('Testing anomaly detection workflow...');
    
    // Step 1: Detect anomalies
    const anomalyData = {
      data_type: 'inventory',
      entity_id: 'shop_test_1',
      time_range: '7d'
    };
    
    const anomalies = await this.apiClient.gatewayPost('/api/v1/anomaly/detect', anomalyData);
    console.log(`  Anomalies detected: ${anomalies.data.anomalies.length}`);
    
    // Step 2: Get alerts
    const alerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts');
    console.log(`  Total alerts: ${alerts.data.total}`);
    
    // Step 3: Acknowledge alert if exists
    if (alerts.data.alerts.length > 0) {
      const alertId = alerts.data.alerts[0].alert_id;
      const acknowledged = await this.apiClient.gatewayPost(
        `/api/v1/anomaly/alerts/${alertId}/acknowledge`,
        { acknowledged_by: 'e2e-test' }
      );
      console.log(`  Alert acknowledged: ${alertId}`);
    }
    
    console.log('✓ Anomaly detection workflow test completed');
  }

  /**
   * Generate final test report
   */
  generateReport() {
    const totalTests = this.results.reduce((sum, r) => sum + (r.total || r.results?.length || 0), 0);
    const passedTests = this.results.reduce((sum, r) => sum + (r.passed || r.results?.filter(t => t.status === 'passed').length || 0), 0);
    const failedTests = this.results.reduce((sum, r) => sum + (r.failed || r.results?.filter(t => t.status === 'failed').length || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
    
    console.log('\nDetailed Results:');
    for (const result of this.results) {
      if (result.type === 'role') {
        console.log(`\n${result.role.charAt(0).toUpperCase() + result.role.slice(1)}:`);
        console.log(`  Total: ${result.total}`);
        console.log(`  Passed: ${result.passed}`);
        console.log(`  Failed: ${result.failed}`);
        console.log(`  Success Rate: ${((result.passed / result.total) * 100).toFixed(2)}%`);
        
        if (result.metrics) {
          console.log(`  Avg Response Time: ${result.metrics.avgResponseTime.toFixed(2)}ms`);
          console.log(`  P95 Response Time: ${result.metrics.p95ResponseTime.toFixed(2)}ms`);
          console.log(`  Error Rate: ${(result.metrics.errorRate * 100).toFixed(2)}%`);
        }
      } else if (result.type === 'integration') {
        console.log(`\nIntegration: ${result.name}`);
        console.log(`  Status: ${result.status.toUpperCase()}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('E2E test runner failed:', error);
      process.exit(1);
    });
}

module.exports = E2ETestRunner;
