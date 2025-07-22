const tf = require('@tensorflow/tfjs-node');
const { db } = require('../utils/db');

// Load or create predictive models
const volatilityModels = {};

async function predictVolatility(tokenSymbol) {
  if (!volatilityModels[tokenSymbol]) {
    await loadModel(tokenSymbol);
  }
  
  // Get historical data
  const history = await getPriceHistory(tokenSymbol, 30);
  if (history.length < 10) return 0.1; // Default volatility
  
  // Prepare data
  const prices = history.map(h => h.price);
  const volatility = calculateHistoricalVolatility(prices);
  
  // Predict future volatility
  const model = volatilityModels[tokenSymbol];
  const input = tf.tensor2d([volatility], [1, 1]);
  const prediction = model.predict(input);
  const result = prediction.dataSync()[0];
  
  return Math.max(0.05, result); // Minimum 5% volatility
}

async function loadModel(tokenSymbol) {
  try {
    // Try to load from DB
    const modelData = await db.get(
      'SELECT model FROM predictive_models WHERE token = ?',
      [tokenSymbol]
    );
    
    if (modelData) {
      const model = await tf.models.modelFromJSON(JSON.parse(modelData.model));
      volatilityModels[tokenSymbol] = model;
      return;
    }
  } catch (e) {
    console.log(`No saved model for ${tokenSymbol}, creating new`);
  }
  
  // Create new model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  
  volatilityModels[tokenSymbol] = model;
}

function calculateHistoricalVolatility(prices) {
  // Simplified volatility calculation
  let sum = 0;
  for (let i = 1; i < prices.length; i++) {
    const change = (prices[i] - prices[i-1]) / prices[i-1];
    sum += Math.abs(change);
  }
  return sum / (prices.length - 1);
}

// Training function
async function trainVolatilityModels() {
  const tokens = await db.all('SELECT DISTINCT token FROM alerts WHERE type = "price"');
  
  for (const { token } of tokens) {
    const history = await getPriceHistory(token, 365);
    if (history.length < 30) continue;
    
    const volatilities = [];
    for (let i = 30; i < history.length; i++) {
      const window = history.slice(i-30, i);
      volatilities.push({
        input: calculateHistoricalVolatility(window.map(h => h.price)),
        output: (history[i].price - history[i-1].price) / history[i-1].price
      });
    }
    
    const model = volatilityModels[token] || createModel();
    const inputs = tf.tensor2d(volatilities.map(v => [v.input]));
    const outputs = tf.tensor2d(volatilities.map(v => [v.output]));
    
    await model.fit(inputs, outputs, {
      epochs: 50,
      batchSize: 32
    });
    
    // Save model
    const modelJSON = await model.toJSON();
    await db.run(
      `INSERT OR REPLACE INTO predictive_models (token, model) 
       VALUES (?, ?)`,
      [token, JSON.stringify(modelJSON)]
    );
  }
}

// Train weekly
setInterval(trainVolatilityModels, 7 * 24 * 60 * 60 * 1000);