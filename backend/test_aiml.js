/**
 * E2E test for AI/ML API endpoints
 */
const http = require('http');

function makeRequest(method, path, body = null, port = 8000) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyStr ? Buffer.byteLength(bodyStr) : 0,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  const results = [];

  // Test 1: AI/ML Health
  console.log('Test 1: AI/ML Health Check');
  try {
    const res = await makeRequest('GET', '/health');
    results.push({ test: 'AI/ML Health', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - ${res.data.status}`);
  } catch (e) {
    results.push({ test: 'AI/ML Health', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 2: Demand Forecast
  console.log('Test 2: Demand Forecast');
  try {
    const res = await makeRequest('POST', '/api/v1/demand/forecast', {
      sku_id: 'SKU-001',
      store_id: 'STORE-001',
      forecast_horizon: 7,
    });
    results.push({ test: 'Demand Forecast', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - Has forecast: ${!!res.data?.forecast_values || !!res.data?.data?.forecast_values}`);
  } catch (e) {
    results.push({ test: 'Demand Forecast', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 3: Inventory Optimization
  console.log('Test 3: Inventory Optimization');
  try {
    const res = await makeRequest('POST', '/api/v1/inventory/optimize', {
      sku_id: 'SKU-001',
      store_id: 'STORE-001',
      current_stock: 50,
      lead_time_days: 7,
      demand_forecast: [20, 25, 30, 25, 20, 15, 10],
      demand_std_dev: 5.0,
      service_level: 0.95,
      holding_cost: 2.0,
      ordering_cost: 50,
    });
    results.push({ test: 'Inventory Optimize', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Inventory Optimize', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 4: Routing Optimization
  console.log('Test 4: Routing Optimization');
  try {
    const res = await makeRequest('POST', '/api/v1/routing/optimize', {
      vehicles: [{ id: 'V1', capacity: 100 }],
      locations: [
        { id: 'L1', x: 0, y: 0, demand: 0 },
        { id: 'L2', x: 10, y: 10, demand: 20 },
        { id: 'L3', x: 20, y: 5, demand: 30 },
      ],
    });
    results.push({ test: 'Routing Optimize', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Routing Optimize', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 5: Supplier Risk
  console.log('Test 5: Supplier Risk Assessment');
  try {
    const res = await makeRequest('POST', '/api/v1/supplier/risk', {
      supplier_id: 'SUP-001',
      current_orders: 5,
      delivery_history: [1, 0, 1, 1, 0, 1, 1],
      financial_health_score: 0.75,
      historical_data: [],
      features: { quality_score: 0.9, reliability_score: 0.85 },
    });
    results.push({ test: 'Supplier Risk', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Supplier Risk', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 6: Anomaly Detection
  console.log('Test 6: Anomaly Detection');
  try {
    const res = await makeRequest('POST', '/api/v1/anomaly/detect', {
      data: [10, 12, 11, 13, 100, 12, 11],
      model: 'isolation_forest',
    });
    results.push({ test: 'Anomaly Detection', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Anomaly Detection', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 7: Gateway proxy to AI/ML
  console.log('Test 7: Gateway → AI/ML Proxy');
  try {
    const res = await makeRequest('POST', '/api/v1/demand/forecast', {
      sku_id: 'SKU-001',
      store_id: 'STORE-001',
      forecast_horizon: 7,
    }, 8080);
    results.push({ test: 'Gateway→AI/ML', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Gateway→AI/ML', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 8: Gateway proxy to Backend
  console.log('Test 8: Gateway → Backend Proxy');
  try {
    const res = await makeRequest('GET', '/health', null, 8080);
    results.push({ test: 'Gateway→Backend', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Gateway→Backend', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Summary
  console.log('\n=== AI/ML TEST SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  results.forEach(r => {
    console.log(`  ${r.pass ? '✓' : '✗'} ${r.test}`);
  });
}

runTests().catch(console.error);
