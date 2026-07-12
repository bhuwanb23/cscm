/**
 * End-to-end test script for CSCM Backend
 */
const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  const results = [];
  
  // Test 1: Health check
  console.log('Test 1: Backend Health Check');
  try {
    const res = await makeRequest('GET', '/health');
    results.push({ test: 'Health', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - ${res.data.status}`);
  } catch (e) {
    results.push({ test: 'Health', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 2: Root endpoint
  console.log('Test 2: Root Endpoint');
  try {
    const res = await makeRequest('GET', '/');
    results.push({ test: 'Root', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - ${res.data.message}`);
  } catch (e) {
    results.push({ test: 'Root', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 3: Register user
  console.log('Test 3: Register User');
  try {
    const res = await makeRequest('POST', '/api/v1/auth/register', {
      username: 'e2etest',
      email: 'e2e@test.com',
      password: 'test123',
      role: 'shopkeeper',
    });
    results.push({ test: 'Register', pass: res.status === 201 || res.status === 409, details: res.data });
    console.log(`  Status: ${res.status} - ${JSON.stringify(res.data).slice(0, 100)}`);
  } catch (e) {
    results.push({ test: 'Register', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 4: Login
  console.log('Test 4: Login');
  let token = null;
  try {
    const res = await makeRequest('POST', '/api/v1/auth/login', {
      username: 'e2etest',
      password: 'test123',
    });
    token = res.data?.data?.token;
    results.push({ test: 'Login', pass: res.status === 200 && !!token, details: res.data });
    console.log(`  Status: ${res.status} - Token: ${token ? 'received' : 'missing'}`);
  } catch (e) {
    results.push({ test: 'Login', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 5: Get profile
  console.log('Test 5: Get Profile');
  try {
    const res = await makeRequest('GET', '/api/v1/auth/profile', null, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'Profile', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - User: ${res.data?.data?.user?.username}`);
  } catch (e) {
    results.push({ test: 'Profile', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 6: Create inventory
  console.log('Test 6: Create Inventory');
  try {
    const res = await makeRequest('POST', '/api/v1/inventory', {
      product_id: 'PROD-001',
      store_id: 'STORE-001',
      quantity: 100,
      unit_cost: 10.50,
      selling_price: 15.99,
    }, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'Create Inventory', pass: res.status === 201, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Create Inventory', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 7: List inventory
  console.log('Test 7: List Inventory');
  try {
    const res = await makeRequest('GET', '/api/v1/inventory/STORE-001', null, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'List Inventory', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - Items: ${res.data?.data?.length || 0}`);
  } catch (e) {
    results.push({ test: 'List Inventory', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 8: Create order
  console.log('Test 8: Create Order');
  try {
    const res = await makeRequest('POST', '/api/v1/orders', {
      order_id: 'ORD-E2E-001',
      store_id: 'STORE-001',
      total_amount: 159.90,
      items: [{ product_id: 'PROD-001', quantity: 10, unit_price: 15.99 }],
    }, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'Create Order', pass: res.status === 201, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Create Order', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 9: Get order
  console.log('Test 9: Get Order');
  try {
    const res = await makeRequest('GET', '/api/v1/orders/ORD-E2E-001', null, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'Get Order', pass: res.status === 200, details: res.data });
    console.log(`  Status: ${res.status} - Order: ${res.data?.data?.order_id}`);
  } catch (e) {
    results.push({ test: 'Get Order', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Test 10: Create shipment
  console.log('Test 10: Create Shipment');
  try {
    const res = await makeRequest('POST', '/api/v1/shipments', {
      shipment_id: 'SHP-E2E-001',
      order_id: 'ORD-E2E-001',
      from_location: 'Warehouse-A',
      to_location: 'Store-001',
      carrier: 'FastShip',
    }, {
      Authorization: `Bearer ${token}`,
    });
    results.push({ test: 'Create Shipment', pass: res.status === 201, details: res.data });
    console.log(`  Status: ${res.status}`);
  } catch (e) {
    results.push({ test: 'Create Shipment', pass: false, error: e.message });
    console.log(`  FAILED: ${e.message}`);
  }

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  results.forEach(r => {
    console.log(`  ${r.pass ? '✓' : '✗'} ${r.test}`);
  });
}

runTests().catch(console.error);
