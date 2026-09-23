/**
 * Test script to check database operations for authentication
 * This will help diagnose why auth endpoints are failing
 */

const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

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
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: data });
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

async function testAuthEndpoints() {
  console.log('=== Testing Authentication Endpoints ===\n');

  // Test 1: Health check
  console.log('1. Backend Health Check');
  const health = await makeRequest(`${BACKEND_URL}/health`);
  console.log(`   Status: ${health.status}`);
  console.log(`   Response: ${JSON.stringify(health.data)}\n`);

  // Test 2: Register with minimal data
  console.log('2. Register User (minimal)');
  const register1 = await makeRequest(`${BACKEND_URL}/api/v1/auth/register`, 'POST', {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'Test123!'
  });
  console.log(`   Status: ${register1.status}`);
  console.log(`   Response: ${JSON.stringify(register1.data)}\n`);

  // Test 3: Register with role
  console.log('3. Register User (with role)');
  const register2 = await makeRequest(`${BACKEND_URL}/api/v1/auth/register`, 'POST', {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'Test123!',
    role: 'user'
  });
  console.log(`   Status: ${register2.status}`);
  console.log(`   Response: ${JSON.stringify(register2.data)}\n`);

  // Test 4: Login with non-existent user
  console.log('4. Login (non-existent user)');
  const login1 = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, 'POST', {
    username: 'nonexistent',
    password: 'Test123!'
  });
  console.log(`   Status: ${login1.status}`);
  console.log(`   Response: ${JSON.stringify(login1.data)}\n`);

  // Test 5: Try login with the user we tried to register
  console.log('5. Login (attempted registered user)');
  const login2 = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, 'POST', {
    username: 'testuser1',
    password: 'Test123!'
  });
  console.log(`   Status: ${login2.status}`);
  console.log(`   Response: ${JSON.stringify(login2.data)}\n`);

  // Test 6: Check if there's a database health endpoint
  console.log('6. Database Status (if available)');
  try {
    const dbStatus = await makeRequest(`${BACKEND_URL}/api/v1/database/status`);
    console.log(`   Status: ${dbStatus.status}`);
    console.log(`   Response: ${JSON.stringify(dbStatus.data)}\n`);
  } catch (e) {
    console.log('   No database status endpoint available\n');
  }

  console.log('=== Summary ===');
  console.log('If registration/login are returning 500, check:');
  console.log('1. Render backend logs for detailed error messages');
  console.log('2. DATABASE_URL environment variable is set correctly');
  console.log('3. Users table exists in PostgreSQL database');
  console.log('4. Database connection is working for user operations');
}

testAuthEndpoints().catch(console.error);
