/**
 * Integration Test for Agent to AI/ML API Communication
 * 
 * This test verifies that the backend agents can successfully communicate
 * with the AI/ML API endpoints.
 */

const axios = require('axios');

// Test configuration
const BASE_URL = process.env.AI_ML_API_URL || 'http://localhost:8000';

// Test data
const testData = {
  demandForecast: {
    sku_id: 'TEST-PRODUCT',
    store_id: 'TEST-STORE',
    forecast_horizon: 7,
    include_confidence_intervals: true
  },
  
  inventoryOptimize: {
    sku_id: 'TEST-PRODUCT',
    store_id: 'TEST-STORE',
    current_stock: 50,
    lead_time_days: 3,
    demand_forecast: [100, 105, 98],
    demand_std_dev: 10,
    service_level: 0.95,
    holding_cost: 0.5,
    ordering_cost: 10
  }
};

async function testDemandForecastAPI() {
  console.log('Testing Demand Forecast API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/demand/forecast`, testData.demandForecast);
    
    if (response.status === 200) {
      console.log('✅ Demand Forecast API test passed');
      console.log(`   SKU: ${response.data.sku_id}`);
      console.log(`   Store: ${response.data.store_id}`);
      console.log(`   Forecast values: ${response.data.forecast_values.length} days`);
      console.log(`   Model version: ${response.data.model_version}`);
      return true;
    } else {
      console.log('❌ Demand Forecast API test failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Demand Forecast API test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testInventoryOptimizationAPI() {
  console.log('Testing Inventory Optimization API...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/inventory/optimize`, testData.inventoryOptimize);
    
    if (response.status === 200) {
      console.log('✅ Inventory Optimization API test passed');
      console.log(`   SKU: ${response.data.sku_id}`);
      console.log(`   Store: ${response.data.store_id}`);
      console.log(`   Reorder point: ${response.data.reorder_point}`);
      console.log(`   Order quantity: ${response.data.order_quantity}`);
      console.log(`   Model version: ${response.data.model_version}`);
      return true;
    } else {
      console.log('❌ Inventory Optimization API test failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Inventory Optimization API test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('Starting Agent to AI/ML API Integration Tests...\n');
  
  const startTime = Date.now();
  
  // Test individual APIs
  const demandTestPassed = await testDemandForecastAPI();
  console.log('');
  
  const inventoryTestPassed = await testInventoryOptimizationAPI();
  console.log('');
  
  // Summary
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('=== Test Summary ===');
  console.log(`Duration: ${duration}ms`);
  console.log(`Demand Forecast API: ${demandTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Inventory Optimization API: ${inventoryTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (demandTestPassed && inventoryTestPassed) {
    console.log('\n🎉 All integration tests passed!');
    console.log('Backend agents can successfully communicate with AI/ML APIs.');
    return true;
  } else {
    console.log('\n💥 Some integration tests failed.');
    console.log('Please check the AI/ML API server and network connectivity.');
    return false;
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runIntegrationTests };