const express = require('express');
const router = express.Router();
const { db } = require('../utils/db');

// Create alert
router.post('/', async (req, res) => {
  const { name, type, chain, token, chatID, condition, value, frequency, userId} = req.body;
  
  if (!name || !type || !chain || !token || !chatID || !condition || !value || !frequency || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO alerts 
      (name, type, chain, token, chatID, condition, value, frequency, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = await new Promise((resolve, reject) => {
      stmt.run(
        name, type, chain, token, chatID, condition, parseFloat(value), frequency, userId,
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    
    const newAlert = {
      id: info.lastID,
      name,
      type,
      chain,
      token,
      chatID,
      condition,
      value: parseFloat(value),
      frequency,
      userId,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(newAlert);
  } catch (err) {
    console.error('Failed to create alert:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user alerts
router.get('/user/:userId', async (req, res) => {
  try {
    const alerts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM alerts WHERE user_id = ?',
        [req.params.userId],
        (err, rows) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          else resolve(rows);
        }
      );
    });
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      name: alert.name,
      type: alert.type,
      chain: alert.chain,
      token: alert.token,
      chatID: alert.chatID,
      condition: alert.condition,
      value: alert.value,
      frequency: alert.frequency,
      userId: alert.user_id,
      is_active: Boolean(alert.is_active),
      created_at: alert.created_at
    }));
    
    res.json(formattedAlerts);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM alerts WHERE id = ?',
        [req.params.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;