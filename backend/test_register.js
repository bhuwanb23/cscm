/**
 * Debug registration endpoint
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
  console.log('Testing registration...');
  
  // Try registering
  const res = await makeRequest('POST', '/api/v1/auth/register', {
    username: 'debuguser',
    email: 'debug@test.com',
    password: 'test123',
    role: 'shopkeeper',
  });
  
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.data, null, 2));
  
  // Check if user was created
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./data/cscm_local.db');
  
  db.all("SELECT * FROM users WHERE username = 'debuguser'", (err, rows) => {
    if (err) {
      console.log('DB Error:', err.message);
    } else {
      console.log('DB Users:', JSON.stringify(rows));
    }
    db.close();
  });
}

test().catch(console.error);
