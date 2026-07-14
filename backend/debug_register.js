/**
 * Debug registration - capture actual error
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
          resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  // First check if the database is initialized by trying a login
  console.log('=== Test: Login with non-existent user (should return 401) ===');
  const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
    username: 'nonexistent',
    password: 'test',
  });
  console.log('Login status:', loginRes.status);
  console.log('Login response:', JSON.stringify(loginRes.data, null, 2));

  // Now try registration
  console.log('\n=== Test: Register new user ===');
  const regRes = await makeRequest('POST', '/api/v1/auth/register', {
    username: 'testdebug',
    email: 'debug@test.com',
    password: 'test123',
    role: 'shopkeeper',
  });
  console.log('Register status:', regRes.status);
  console.log('Register response:', JSON.stringify(regRes.data, null, 2));

  // Check if users table exists in the running server's DB
  // by trying to access a protected endpoint (should get 401, not 500)
  console.log('\n=== Test: Protected endpoint (should be 401) ===');
  const profileRes = await makeRequest('GET', '/api/v1/auth/profile');
  console.log('Profile status:', profileRes.status);
  console.log('Profile response:', JSON.stringify(profileRes.data, null, 2));
}

test().catch(console.error);
