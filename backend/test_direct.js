/**
 * Test direct database operations
 */
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'cscm_local.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log('Error opening database:', err.message);
  } else {
    console.log('Database opened successfully');
  }
});

// Test insert
db.run(`INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`, 
  ['testdirect', 'testdirect@test.com', 'hashedpassword', 'shopkeeper'], 
  function(err) {
    if (err) {
      console.log('Insert error:', err.message);
    } else {
      console.log('Insert successful, lastID:', this.lastID);
    }
    
    // Verify
    db.all("SELECT * FROM users WHERE username = 'testdirect'", (err2, rows) => {
      if (err2) {
        console.log('Select error:', err2.message);
      } else {
        console.log('Found users:', rows.length);
        if (rows.length > 0) {
          console.log('User:', JSON.stringify(rows[0]));
        }
      }
      db.close();
    });
  }
);
