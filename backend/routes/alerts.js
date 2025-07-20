const express = require('express');
const router = express.Router();
const { db } = require('../utils/db');
const auth = require('../middleware/auth');

// Create alert
router.post('/', auth, async (req, res) => {
  const { name, type, chain, token, accountAddress, condition, value, frequency, cooldown, custom_message, createdAt, lastTriggered } = req.body;  
  const userId = req.user.id;

  // Fetch user to get telegram_chat_id
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  const chatID = user.telegram_chat_id;
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!name || !type || !chain || !token || !chatID || !condition || !value || !frequency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO alerts 
      (name, type, chain, token, accountAddress, chatID, condition, value, frequency, cooldown, custom_message, createdAt, lastTriggered, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = await new Promise((resolve, reject) => {
      stmt.run(
        name, type, chain, token, accountAddress, chatID, condition, parseFloat(value), frequency, cooldown, custom_message, createdAt, lastTriggered, userId,
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
      accountAddress,
      chatID,
      condition,
      value: parseFloat(value),
      frequency,
      cooldown: 5, // Default cooldown in minutes
      custom_message: null,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      userId,
      active: true,
    };
    
    res.status(201).json(newAlert);
  } catch (err) {
    console.error('Failed to create alert:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user alerts
router.get('/user', auth, async (req, res) => {
  try {
    const alerts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM alerts WHERE user_id = ?',
        [req.user.id],
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
      address: alert.accountAddress,
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
  const updateData = req.body.updateData;
  console.log('Update data:', updateData);
  
  try {
    const stmt = db.prepare(`
      UPDATE alerts 
      SET name = ?, type = ?, chain = ?, token = ?, accountAddress = ?, chatID = ?, 
          condition = ?, value = ?, frequency = ?, 
          cooldown = ?, custom_message = ?, createdAt = ?, lastTriggered = ?, is_active = ?
      WHERE id = ?
    `);
    console.log('DB prepared')
    
    await new Promise((resolve, reject) => {
      stmt.run(
        updateData.name,
        updateData.type,
        updateData.chain,
        updateData.token,
        updateData.accountAddress,
        updateData.chatID,
        updateData.condition,
        updateData.value,
        updateData.frequency,
        updateData.cooldown || 5,
        updateData.custom_message || '',
        updateData.createdAt || new Date().toISOString(),
        updateData.lastTriggered || null,
        updateData.active,
        id,
        function(err) {
          if (err) {
            console.error('Failed to update alert:', err);
            reject(err);
          } else resolve(this);
        }
      );
    });
    console.log(`Alert ${id} updated with data`);

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
    accountAddress: dbAlert.accountAddress,
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