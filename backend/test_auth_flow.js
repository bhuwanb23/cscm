/**
 * Test auth flow end-to-end
 */
const http = require('http');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
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

async function test() {
  console.log('=== Auth Flow Test ===\n');

  // Test 1: Register
  console.log('1. Register user');
  const regRes = await makeRequest('POST', '/api/v1/auth/register', {
    username: 'flowtest',
    email: 'flow@test.com',
    password: 'test123',
    role: 'shopkeeper',
  });
  console.log('   Status:', regRes.status);
  console.log('   Body:', JSON.stringify(regRes.data));

  if (regRes.status === 201) {
    const token = regRes.data?.data?.token;
    console.log('   Token:', token ? 'YES' : 'NO');

    // Test 2: Login
    console.log('\n2. Login');
    const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
      username: 'flowtest',
      password: 'test123',
    });
    console.log('   Status:', loginRes.status);
    console.log('   Body:', JSON.stringify(loginRes.data).slice(0, 100));

    if (loginRes.status === 200) {
      const loginToken = loginRes.data?.data?.token;
      
      // Test 3: Get profile
      console.log('\n3. Get profile');
      const profileRes = await makeRequest('GET', '/api/v1/auth/profile');
      // Add auth header manually
      const profileOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/profile',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${loginToken}` },
      };
      
      const profileData = await new Promise((resolve) => {
        const req = http.request(profileOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
            catch { resolve({ status: res.statusCode, data }); }
          });
        });
        req.on('error', (e) => resolve({ status: 0, error: e.message }));
        req.end();
      });
      console.log('   Status:', profileData.status);
      console.log('   Body:', JSON.stringify(profileData.data).slice(0, 100));
    }
  }
}

test().catch(console.error);
