const { db } = require('../utils/db');
const { predictVolatility } = require('../ai/predictiveModels');

// Optimize alert thresholds based on market conditions
async function optimizeAlertThresholds() {
  try {
    // Get all price alerts
    const alerts = await db.all('SELECT * FROM alerts WHERE type = "price"');
    
    for (const alert of alerts) {
      const volatility = await predictVolatility(alert.token);
      const newThreshold = calculateDynamicThreshold(alert.value, volatility);
      
      await db.run(
        'UPDATE alerts SET value = ? WHERE id = ?',
        [newThreshold, alert.id]
      );
      
      console.log(`Optimized alert ${alert.id}: ${alert.value} -> ${newThreshold}`);
    }
  } catch (error) {
    console.error('Alert optimization failed:', error);
  }
}

function calculateDynamicThreshold(baseValue, volatility) {
  // Higher volatility = wider threshold
  const multiplier = 1 + (volatility * 0.5);
  return baseValue * multiplier;
}

// Run daily at 3 AM
setInterval(optimizeAlertThresholds, 24 * 60 * 60 * 1000);