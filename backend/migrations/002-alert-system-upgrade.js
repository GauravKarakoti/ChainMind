const db = require('../utils/db');

db.serialize(() => {
    db.run(`ALTER TABLE alerts ADD COLUMN notification_channels TEXT;`)
    db.run(`ALTER TABLE alerts ADD COLUMN alert_subtype TEXT;`)
    db.run(`ALTER TABLE alerts ADD COLUMN threshold_type TEXT;`)

    db.run(`CREATE TABLE contract_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        function_name TEXT NOT NULL,
        parameters TEXT,
        value TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)
});

db.close();