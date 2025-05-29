const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.resolve(__dirname, '../../data/chainmind.db');
const DB_DIR = path.dirname(DB_PATH);

// Create database directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database at', DB_PATH);
    initializeDatabase();
  }
});

// Create tables if they don't exist
function initializeDatabase() {
  db.serialize(() => {
    // Event logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS event_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        recipient TEXT,
        alert_type TEXT,
        message_id TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Webhook events table
    db.run(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        processed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API request cache
    db.run(`
      CREATE TABLE IF NOT EXISTS api_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        params TEXT NOT NULL,
        response TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User queries history
    db.run(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        response TEXT,
        error TEXT,
        user_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  });
}

/**
 * Create a new event log
 * @param {Object} logData 
 * @returns {Promise<number>} Insert ID
 */
function createEventLog(logData) {
  return new Promise((resolve, reject) => {
    const { type, status, recipient, alert_type, message_id, error } = logData;
    const stmt = db.prepare(`
      INSERT INTO event_logs 
      (type, status, recipient, alert_type, message_id, error) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      type,
      status,
      recipient,
      alert_type,
      message_id,
      error,
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
    
    stmt.finalize();
  });
}

/**
 * Log a webhook event
 * @param {string} eventType 
 * @param {Object} data 
 * @returns {Promise<number>} Insert ID
 */
function logWebhookEvent(eventType, data) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO webhook_events 
      (event_type, data) 
      VALUES (?, ?)
    `);
    
    stmt.run(
      eventType,
      JSON.stringify(data),
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
    
    stmt.finalize();
  });
}

/**
 * Get cached API response
 * @param {string} endpoint 
 * @param {Object} params 
 * @returns {Promise<Object|null>} Cached response or null
 */
function getApiCache(endpoint, params) {
  return new Promise((resolve, reject) => {
    const paramsString = JSON.stringify(params);
    
    db.get(`
      SELECT response 
      FROM api_cache 
      WHERE endpoint = ? 
        AND params = ? 
        AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `, [endpoint, paramsString], (err, row) => {
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.response) : null);
    });
  });
}

/**
 * Set API cache
 * @param {string} endpoint 
 * @param {Object} params 
 * @param {Object} response 
 * @param {number} ttl Time to live in seconds (default: 300)
 */
function setApiCache(endpoint, params, response, ttl = 300) {
  return new Promise((resolve, reject) => {
    const paramsString = JSON.stringify(params);
    const responseString = JSON.stringify(response);
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO api_cache 
      (endpoint, params, response, expires_at) 
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      endpoint,
      paramsString,
      responseString,
      expiresAt,
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
    
    stmt.finalize();
  });
}

/**
 * Log user query
 * @param {string} query 
 * @param {Object} response 
 * @param {string} userIp 
 * @param {string} error 
 */
function logQuery(query, response = null, userIp = null, error = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO query_history 
      (query, response, user_ip, error) 
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      query,
      response ? JSON.stringify(response) : null,
      userIp,
      error,
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
    
    stmt.finalize();
  });
}

/**
 * Get recent queries (for dashboard)
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
function getRecentQueries(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, query, created_at 
      FROM query_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Close database connection on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Database close error:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = {
  db,
  createEventLog,
  logWebhookEvent,
  getApiCache,
  setApiCache,
  logQuery,
  getRecentQueries
};