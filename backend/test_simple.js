/**
 * Simple test to check if server can write to database
 */
const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
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

async function test() {
  // Test 1: Try to create inventory (should work without auth for testing)
  console.log('Test 1: Create inventory item');
  const invRes = await makeRequest('POST', '/api/v1/inventory', {
    product_id: 'TEST-001',
    store_id: 'TEST-STORE',
    quantity: 50,
  });
  console.log('  Status:', invRes.status);
  console.log('  Response:', JSON.stringify(invRes.data).slice(0, 100));

  // Test 2: Try to list inventory
  console.log('Test 2: List inventory');
  const listRes = await makeRequest('GET', '/api/v1/inventory/TEST-STORE');
  console.log('  Status:', listRes.status);
  console.log('  Response:', JSON.stringify(listRes.data).slice(0, 100));
}

test().catch(console.error);
