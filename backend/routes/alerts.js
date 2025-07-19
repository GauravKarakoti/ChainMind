const express = require('express');
const router = express.Router();
const { db } = require('../utils/db');

// Create alert
router.post('/', async (req, res) => {
  const { name, type, chain, token, chatID, condition, value, frequency, cooldown, custom_message, createdAt, lastTriggered, userId} = req.body;
  
  if (!name || !type || !chain || !token || !chatID || !condition || !value || !frequency || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO alerts 
      (name, type, chain, token, chatID, condition, value, frequency, cooldown, custom_message, createdAt, lastTriggered, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = await new Promise((resolve, reject) => {
      stmt.run(
        name, type, chain, token, chatID, condition, parseFloat(value), frequency, cooldown, custom_message, createdAt, lastTriggered, userId,
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
      cooldown: 5, // Default cooldown in minutes
      custom_message: null,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      userId,
      is_active: true,
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
      cooldown: alert.cooldown,
      custom_message: alert.custom_message,
      createdAt: alert.createdAt,
      lastTriggered: alert.lastTriggered,
      userId: alert.user_id,
      is_active: Boolean(alert.is_active),
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

router.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE alerts SET is_active = ? WHERE id = ?',
        [active, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    console.log(`Alert ${id} toggled to ${active}`);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE alerts SET lastTriggered = ? WHERE id = ?',
        [new Date().toISOString().slice(0,10), id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    const updatedAlert = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM alerts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    console.log('Updated alert:', updatedAlert);
    
    res.status(200).json(formatAlert(updatedAlert));
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle alert' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE alerts 
      SET name = ?, type = ?, chain = ?, token = ?, chatID = ?, 
          condition = ?, value = ?, frequency = ?, 
          cooldown = ?, custom_message = ?, createdAt = ?, lastTriggered = ?, is_active = ?
      WHERE id = ?
    `);
    
    await new Promise((resolve, reject) => {
      stmt.run(
        updateData.name,
        updateData.type,
        updateData.chain,
        updateData.token,
        updateData.chatID,
        updateData.condition,
        updateData.value,
        updateData.frequency,
        updateData.cooldown,
        updateData.custom_message,
        updateData.createdAt || new Date().toISOString(),
        updateData.lastTriggered || null,
        updateData.active,
        id,
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE alerts SET lastTriggered = ? WHERE id = ?',
        [new Date().toISOString().slice(0,10), id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Fetch updated alert
    const updatedAlert = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM alerts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json(formatAlert(updatedAlert));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Helper function
function formatAlert(dbAlert) {
  return {
    id: dbAlert.id,
    name: dbAlert.name,
    type: dbAlert.type,
    chain: dbAlert.chain,
    token: dbAlert.token,
    chatID: dbAlert.chatID,
    condition: dbAlert.condition,
    value: dbAlert.value,
    frequency: dbAlert.frequency,
    userId: dbAlert.user_id,
    active: Boolean(dbAlert.is_active),
    cooldown: dbAlert.cooldown,
    custom_message: dbAlert.custom_message,
    createdAt: dbAlert.createdAt,
    lastTriggered: dbAlert.last_triggered
  };
}

module.exports = router;