const db = require('../utils/db');

db.serialize(() => {
  db.run(`ALTER TABLE query_history ADD COLUMN api TEXT`);
  db.run(`ALTER TABLE query_history ADD COLUMN chain TEXT`);
  console.log('Added api and chain columns to query_history');
});

db.close();