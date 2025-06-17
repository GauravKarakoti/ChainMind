const express = require('express');
const app = express();
const { handleBlockchainEvent } = require('./utils/notification');
const { logWebhookEvent } = require('./utils/db');

app.use(express.json());

app.post('/webhook/multi-chain-alerts', (req, res) => {
  try {
    const { event, data, chain } = req.body;
    
    // Log for auditing
    logWebhookEvent(`${chain}_${event}`, data);
    
    // Add chain info to event data
    handleBlockchainEvent({ 
      type: event, 
      data: { ...data, chain } 
    });
    
    res.status(200).end();
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).end();
  }
});

// Aptos-specific stream endpoint
app.post('/webhook/aptos-stream', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'whale_movement') {
    handleBlockchainEvent({
      type: 'WHALE_MOVEMENT',
      data: {
        ...data,
        chain: 'aptos/mainnet'
      }
    });
  }
  
  res.status(200).end();
});

// New: Address monitoring webhook
app.post('/webhook/address-monitor', (req, res) => {
  const { address } = req.body;
  // Implementation would register with Nodit's webhook service
  res.json({ status: 'monitoring_started', address });
});

module.exports = app;