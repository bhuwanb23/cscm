/**
 * API Integration Tests for Backend Agents
 * 
 * This script tests the integration between backend agents and AI/ML APIs.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = process.env.AI_ML_API_URL || 'http://localhost:8000';

// Test data for various APIs
const testScenarios = {
  demandForecasting: {
    sku_id: 'TEST-SKU-001',
    store_id: 'TEST-STORE-001',
    forecast_horizon: 7,
    include_confidence_intervals: true
  },
  
  inventoryOptimization: {
    sku_id: 'TEST-SKU-001',
    store_id: 'TEST-STORE-001',
    current_stock: 150,
    lead_time_days: 3,
    demand_forecast: [100, 105, 98, 110, 95, 102, 99],
    demand_std_dev: 7.5,
    service_level: 0.95,
    holding_cost: 0.5,
    ordering_cost: 25
  },
  
  routingOptimization: {
    vehicles: [
      { id: 'V1', capacity: 1000, start_location: { lat: 12.9716, lng: 77.5946 } },
      { id: 'V2', capacity: 1000, start_location: { lat: 12.9716, lng: 77.5946 } }
    ],
    deliveries: [
      { id: 'D1', location: { lat: 12.9717, lng: 77.5947 }, demand: 100, time_window: { start: '09:00', end: '12:00' } },
      { id: 'D2', location: { lat: 12.9718, lng: 77.5948 }, demand: 150, time_window: { start: '10:00', end: '13:00' } },
      { id: 'D3', location: { lat: 12.9719, lng: 77.5949 }, demand: 200, time_window: { start: '11:00', end: '14:00' } }
    ]
  },
  
  supplierRisk: {
    supplier_id: 'TEST-SUPPLIER-001',
    historical_performance: [
      { delivery_date: '2023-01-01', promised_date: '2023-01-01', quality_score: 0.95 },
      { delivery_date: '2023-01-05', promised_date: '2023-01-04', quality_score: 0.85 },
      { delivery_date: '2023-01-10', promised_date: '2023-01-10', quality_score: 0.98 }
    ],
    financial_health: 0.85,
    geographic_risk: 0.2
  },
  
  anomalyDetection: {
    metric_name: 'daily_sales',
    values: [100, 105, 98, 102, 99, 101, 97, 103, 96, 104, 95, 1000], // Last value is an anomaly
    timestamps: [
      '2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z', '2023-01-03T00:00:00Z',
      '2023-01-04T00:00:00Z', '2023-01-05T00:00:00Z', '2023-01-06T00:00:00Z',
      '2023-01-07T00:00:00Z', '2023-01-08T00:00:00Z', '2023-01-09T00:00:00Z',
      '2023-01-10T00:00:00Z', '2023-01-11T00:00:00Z', '2023-01-12T00:00:00Z'
    ]
  }
};

// Test results storage
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  testDetails: []
};

// Utility function to log test results
function logTestResult(testName, passed, details = '') {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
    console.log(`✅ ${testName}: PASSED ${details}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: FAILED ${details}`);
  }
  testResults.testDetails.push({ testName, passed, details });
}

// Test Demand Forecasting API
async function testDemandForecastingAPI() {
  console.log('\n--- Testing Demand Forecasting API ---');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/demand/forecast`, testScenarios.demandForecasting);
    
    const isValid = response.status === 200 && 
                   response.data.sku_id === testScenarios.demandForecasting.sku_id &&
                   response.data.forecast_values &&
                   response.data.forecast_values.length > 0;
    
    logTestResult('Demand Forecasting API Call', isValid, 
                 `Status: ${response.status}, SKU: ${response.data.sku_id}, Forecast days: ${response.data.forecast_values?.length || 0}`);
    
    return isValid;
  } catch (error) {
    logTestResult('Demand Forecasting API Call', false, `Error: ${error.message}`);
    return false;
  }
}

// Test Inventory Optimization API
async function testInventoryOptimizationAPI() {
  console.log('\n--- Testing Inventory Optimization API ---');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/inventory/optimize`, testScenarios.inventoryOptimization);
    
    const isValid = response.status === 200 && 
                   response.data.sku_id === testScenarios.inventoryOptimization.sku_id &&
                   response.data.reorder_point !== undefined &&
                   response.data.order_quantity !== undefined;
    
    logTestResult('Inventory Optimization API Call', isValid, 
                 `Status: ${response.status}, SKU: ${response.data.sku_id}, Reorder Point: ${response.data.reorder_point}, Order Qty: ${response.data.order_quantity}`);
    
    return isValid;
  } catch (error) {
    logTestResult('Inventory Optimization API Call', false, `Error: ${error.message}`);
    return false;
  }
}

// Test Routing Optimization API
async function testRoutingOptimizationAPI() {
  console.log('\n--- Testing Routing Optimization API ---');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/routing/optimize`, testScenarios.routingOptimization);
    
    const isValid = response.status === 200 && 
                   response.data.routes &&
                   Array.isArray(response.data.routes);
    
    logTestResult('Routing Optimization API Call', isValid, 
                 `Status: ${response.status}, Routes: ${response.data.routes?.length || 0}`);
    
    return isValid;
  } catch (error) {
    logTestResult('Routing Optimization API Call', false, `Error: ${error.message}`);
    return false;
  }
}

// Test Supplier Risk Assessment API
async function testSupplierRiskAPI() {
  console.log('\n--- Testing Supplier Risk Assessment API ---');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/supplier/risk`, testScenarios.supplierRisk);
    
    const isValid = response.status === 200 && 
                   response.data.risk_score !== undefined &&
                   response.data.risk_level !== undefined;
    
    logTestResult('Supplier Risk Assessment API Call', isValid, 
                 `Status: ${response.status}, Risk Score: ${response.data.risk_score}, Risk Level: ${response.data.risk_level}`);
    
    return isValid;
  } catch (error) {
    logTestResult('Supplier Risk Assessment API Call', false, `Error: ${error.message}`);
    return false;
  }
}

// Test Anomaly Detection API
async function testAnomalyDetectionAPI() {
  console.log('\n--- Testing Anomaly Detection API ---');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/anomaly/detect`, testScenarios.anomalyDetection);
    
    const isValid = response.status === 200 && 
                   response.data.anomalies &&
                   Array.isArray(response.data.anomalies);
    
    logTestResult('Anomaly Detection API Call', isValid, 
                 `Status: ${response.status}, Anomalies detected: ${response.data.anomalies?.length || 0}`);
    
    return isValid;
  } catch (error) {
    logTestResult('Anomaly Detection API Call', false, `Error: ${error.message}`);
    return false;
  }
}

// Test API connectivity
async function testAPIConnectivity() {
  console.log('\n--- Testing API Connectivity ---');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const isValid = response.status === 200;
    
    logTestResult('API Server Connectivity', isValid, `Status: ${response.status}`);
    return isValid;
  } catch (error) {
    logTestResult('API Server Connectivity', false, `Error: ${error.message}`);
    return false;
  }
}

// Generate test report
function generateTestReport() {
  console.log('\n=== API Integration Test Report ===');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests}`);
  console.log(`Failed: ${testResults.failedTests}`);
  console.log(`Success Rate: ${testResults.totalTests > 0 ? ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) : 0}%`);
  
  if (testResults.failedTests > 0) {
    console.log('\nFailed Tests:');
    testResults.testDetails
      .filter(detail => !detail.passed)
      .forEach(detail => {
        console.log(`  ❌ ${detail.testName}: ${detail.details}`);
      });
  }
  
  // Save results to file
  const reportPath = path.join(__dirname, 'api_test_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed results saved to: ${reportPath}`);
  
  return testResults.failedTests === 0;
}

// Main test function
async function runAPIIntegrationTests() {
  console.log('Starting API Integration Tests...\n');
  
  const startTime = Date.now();
  
  // Test basic connectivity first
  await testAPIConnectivity();
  
  // Test individual APIs
  await testDemandForecastingAPI();
  await testInventoryOptimizationAPI();
  await testRoutingOptimizationAPI();
  await testSupplierRiskAPI();
  await testAnomalyDetectionAPI();
  
  const endTime = Date.now();
  console.log(`\nTest execution time: ${endTime - startTime}ms`);
  
  // Generate and display report
  const allTestsPassed = generateTestReport();
  
  return allTestsPassed;
}

// Run tests if script is executed directly
if (require.main === module) {
  runAPIIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAPIIntegrationTests, testScenarios };