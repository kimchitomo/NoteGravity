const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../data/database.sqlite');
db.get("SELECT length(value) as len, updated_at FROM state WHERE key='tree-store'", (err, row) => {
  console.log(row);
  process.exit(0);
});
