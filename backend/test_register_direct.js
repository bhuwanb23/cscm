const http = require('http');
const bcrypt = require('bcryptjs');

// Try to register directly through the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'cscm_local.db');
const db = new sqlite3.Database(dbPath);

async function test() {
  const username = 'directuser_' + Date.now();
  const email = username + '@test.com';
  const password = 'test123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Testing direct database insert...');
  db.run(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, 'shopkeeper'],
    function(err) {
      if (err) {
        console.log('Insert error:', err.message);
      } else {
        console.log('Insert OK, lastID:', this.lastID);
        
        // Verify
        db.all('SELECT * FROM users WHERE id = ?', [this.lastID], (err2, rows) => {
          if (err2) {
            console.log('Select error:', err2.message);
          } else {
            console.log('User found:', JSON.stringify(rows[0]));
            
            // Now try to login via API
            console.log('\nTesting login via API...');
            const loginData = JSON.stringify({ username, password });
            const options = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/v1/auth/login',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData),
              },
            };
            
            const req = http.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                console.log('Login status:', res.statusCode);
                console.log('Login response:', data);
                db.close();
              });
            });
            req.on('error', (e) => {
              console.log('Login error:', e.message);
              db.close();
            });
            req.write(loginData);
            req.end();
          }
        });
      }
    }
  );
}

test().catch(console.error);
