require('dotenv').config();
const express = require('express');
const app = express();
const webhookServer = require('./webhooks');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to ChainMind API');
});

// Routes
const blockchainRouter = require('./routes/blockchain');
app.use('/api/nodit', blockchainRouter);

const loggerRouter = require('./routes/logger');
app.use('/api/logger', loggerRouter);

const aiRouter = require('./routes/ai');
app.use('/api/ai', aiRouter);

// Start webhook server
webhookServer.listen(3001, () => {
  console.log('Webhook server running');
});

app.listen(4000, () => {
  console.log('API server running');
});