const { getTokenPrice } = require('../utils/cache');
const { sendTelegramAlert } = require('../utils/notification');
const { db } = require('../utils/db');
const axios = require('axios');

const ALERT_INTERVAL = 10000; // 5 minutes

async function checkPriceAlerts() {
  try {
    const alerts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM alerts WHERE type = "price" AND is_active = 1',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const tokens = [...new Set(alerts.map(a => a.token))];

    // Batch fetch prices
    const prices = await Promise.all(
      tokens.map(token => getTokenPrice(token))
    );
    
    const priceMap = Object.fromEntries(
      tokens.map((token, i) => [token, prices[i]])
    );

    for (const alert of alerts) {
      try {
        const price = priceMap[alert.token];
        console.log(price,alert.value)
        
        let shouldTrigger = false;
        if (alert.condition === 'above' && price > alert.value) {
          shouldTrigger = true;
        } else if (alert.condition === 'below' && price < alert.value) {
          shouldTrigger = true;
        }

        console.log(shouldTrigger, alert)
        
        if (shouldTrigger) {
          // Trigger notifications
          const message = `${alert.token} price is now $${price} (${alert.condition} $${alert.value})`;
          
          await sendTelegramAlert({ 
            chatID: alert.chatID,
            message: message
          });
          console.log("Telegram message sent")
          
          // Deactivate if one-time alert
          if (alert.frequency === 'once') {
            db.run('UPDATE alerts SET is_active = 0 WHERE id = ?', [alert.id]);
          }
        }
      } catch (err) {
        console.error(`Error processing alert ${alert.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Alert worker error:', err);
  }
}

// Start the worker
setInterval(checkPriceAlerts, ALERT_INTERVAL);
console.log('Alert worker started');