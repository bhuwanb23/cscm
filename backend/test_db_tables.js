const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'cscm_local.db');
console.log('DB path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.log('DB open error:', err.message);
  else console.log('DB opened OK');
});
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) console.log('Query error:', err.message);
  else console.log('Tables:', rows.map(r => r.name).join(', '));
  db.close();
});
