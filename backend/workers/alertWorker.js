const { getTokenPrice } = require('../utils/cache');
const { sendTelegramAlert, sendNotifications } = require('../utils/notification');
const { db } = require('../utils/db');
const { fetchAccountActivity, fetchEthGasPrice, fetchLargeTransfers, getAlertsByType } = require("./alerts.js")

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

async function checkAlerts() {
  await checkPriceAlerts();
  await checkGasAlerts();
  await checkWhaleAlerts();
  await checkAccountActivityAlerts();
}

async function checkGasAlerts() {
  const alerts = await getAlertsByType('gas');
  const ethGasPrice = await fetchEthGasPrice();
  
  for (const alert of alerts) {
    if ((alert.condition === 'above' && ethGasPrice > alert.value) ||
        (alert.condition === 'below' && ethGasPrice < alert.value)) {
      const message = `Gas price alert: ${ethGasPrice} gwei (${alert.condition} ${alert.value})`;
      await sendNotifications(alert, message);
    }
  }
}

async function checkWhaleAlerts() {
  const alerts = await getAlertsByType('whale');
  
  for (const alert of alerts) {
    const largeTransfers = await fetchLargeTransfers(alert.chain, alert.token, alert.value);
    if (largeTransfers.length > 0) {
      const message = `Whale alert: ${largeTransfers.length} large transfers detected`;
      await sendNotifications(alert, message);
    }
  }
}

async function checkAccountActivityAlerts() {
  const alerts = await getAlertsByType('account-activity');
  
  for (const alert of alerts) {
    const activity = await fetchAccountActivity(alert.chain, alert.accountAddress);
    if (activity > alert.value) {
      const message = `Account activity alert: ${activity} transactions (${alert.condition} ${alert.value})`;
      await sendNotifications(alert, message);
    }
  }
}

// Start the worker
setInterval(checkAlerts, ALERT_INTERVAL);
console.log('Alert worker started');