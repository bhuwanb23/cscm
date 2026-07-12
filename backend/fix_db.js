const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/cscm_local.db');

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.run(createUsersTable, function(err) {
  if (err) {
    console.log('Error creating users table:', err.message);
  } else {
    console.log('Users table created successfully');
  }
  
  // Verify
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err2, rows) => {
    if (err2) {
      console.log('Error:', err2.message);
    } else {
      console.log('All tables:', rows.map(r => r.name).join(', '));
    }
    db.close();
  });
});
