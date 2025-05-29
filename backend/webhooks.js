const express = require('express');
const app = express();
const { handleBlockchainEvent } = require('./utils/notifications');

app.use(express.json());

// Enhanced webhook handler
app.post('/webhook/erc20-alerts', (req, res) => {
  try {
    const { event, data } = req.body;
    
    handleBlockchainEvent({ type: event, data });
    res.status(200).end();
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).end();
  }
});

// New: Address monitoring webhook
app.post('/webhook/address-monitor', (req, res) => {
  const { address, events } = req.body;
  // Implementation would register with Nodit's webhook service
  res.json({ status: 'monitoring_started', address });
});

module.exports = app;