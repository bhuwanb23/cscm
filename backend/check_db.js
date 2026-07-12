const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/cscm_local.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.log('Error:', err.message);
  } else {
    console.log('Tables:', rows.map(r => r.name).join(', '));
  }
  
  // Try to insert a user directly
  db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES ('directtest', 'direct@test.com', 'hash', 'user')`, function(err) {
    if (err) {
      console.log('Insert error:', err.message);
    } else {
      console.log('Insert OK, lastID:', this.lastID);
    }
    
    db.all("SELECT * FROM users", (err2, rows2) => {
      if (err2) {
        console.log('Select error:', err2.message);
      } else {
        console.log('Users:', JSON.stringify(rows2));
      }
      db.close();
    });
  });
});
