const { getTokenPrice } = require('../utils/cache');
const { sendNotifications } = require('../utils/notification');
const { db } = require('../utils/db');
const { fetchAccountActivity, fetchEthGasPrice, fetchLargeTransfers, getAlertsByType } = require("./alerts.js")

const ALERT_INTERVAL = 60 * 1000; // 1 minute
const lastTriggered = new Map();

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

    const now = Date.now();

    for (const alert of alerts) {
      try {
        const price = priceMap[alert.token];
        console.log(price,alert.value)
        const lastTriggerTime = lastTriggered.get(alert.id) || 0;
        const cooldownMs = alert.cooldown * 60 * 1000; // Convert minutes to ms
        
        // Check if alert is in cooldown
        if (now - lastTriggerTime < cooldownMs) continue;

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
          
          await sendNotifications(alert,message,price);
          console.log("Telegram message sent")
          lastTriggered.set(alert.id, now); // Update last trigger time

          // Deactivate if one-time alert
          if (alert.frequency === 'once') {
            db.run('UPDATE alerts SET is_active = 0 WHERE id = ?', [alert.id]);
            lastTriggered.delete(alert.id); // Clean up
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
  const now = Date.now();
  
  for (const alert of alerts) {
    const lastTriggerTime = lastTriggered.get(alert.id) || 0;
    const cooldownMs = alert.cooldown * 60 * 1000;
    
    if (now - lastTriggerTime < cooldownMs) continue;

    if ((alert.condition === 'above' && ethGasPrice > alert.value) ||
        (alert.condition === 'below' && ethGasPrice < alert.value)) {
      const message = `Gas price alert: ${ethGasPrice} gwei (${alert.condition} ${alert.value})`;
      await sendNotifications(alert, message);
      lastTriggered.set(alert.id, now);
          
      if (alert.frequency === 'once') {
        db.run('UPDATE alerts SET is_active = 0 WHERE id = ?', [alert.id]);
        lastTriggered.delete(alert.id);
      }
    }
  }
}

async function checkWhaleAlerts() {
  const alerts = await getAlertsByType('whale');
  const now = Date.now();
  
  for (const alert of alerts) {
    const lastTriggerTime = lastTriggered.get(alert.id) || 0;
    const cooldownMs = alert.cooldown * 60 * 1000;
    
    if (now - lastTriggerTime < cooldownMs) continue;

    const largeTransfers = await fetchLargeTransfers(alert.chain, alert.token, alert.value);
    if (largeTransfers.length > 0) {
      const message = `Whale alert: ${largeTransfers.length} large transfers detected`;
      await sendNotifications(alert, message);
      lastTriggered.set(alert.id, now);
          
      if (alert.frequency === 'once') {
        db.run('UPDATE alerts SET is_active = 0 WHERE id = ?', [alert.id]);
        lastTriggered.delete(alert.id);
      }
    }
  }
}

async function checkAccountActivityAlerts() {
  const alerts = await getAlertsByType('account-activity');
  const now = Date.now();
  
  for (const alert of alerts) {
    const lastTriggerTime = lastTriggered.get(alert.id) || 0;
    const cooldownMs = alert.cooldown * 60 * 1000;
    
    if (now - lastTriggerTime < cooldownMs) continue;

    const activity = await fetchAccountActivity(alert.chain, alert.accountAddress);
    if (activity > alert.value) {
      const message = `Account activity alert: ${activity} transactions (${alert.condition} ${alert.value})`;
      await sendNotifications(alert, message);
      lastTriggered.set(alert.id, now);
          
      if (alert.frequency === 'once') {
        db.run('UPDATE alerts SET is_active = 0 WHERE id = ?', [alert.id]);
        lastTriggered.delete(alert.id);
      }
    }
  }
}

// Start the worker
setInterval(checkAlerts, ALERT_INTERVAL);
console.log('Alert worker started');

setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of lastTriggered) {
    // Remove entries older than 7 days
    if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
      lastTriggered.delete(id);
    }
  }
}, 24 * 60 * 60 * 1000);