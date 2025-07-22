require('dotenv').config();
const express = require('express');
const app = express();
const webhookServer = require('./webhooks');

const PORT = process.env.PORT;
const WEBHOOK_PORT = 3001;

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

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const alertRouter = require('./routes/alerts');
require('./workers/alertWorker'); // Start alert worker

app.use('/api/alerts', alertRouter);

const tokensRouter = require('./routes/tokens');
app.use('/api/tokens', tokensRouter);

const workflowRouter = require('./routes/workflows');
app.use('/api/workflows', workflowRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

webhookServer.listen(WEBHOOK_PORT, () => {
  console.log(`Webhook server running on port ${WEBHOOK_PORT}`);
});