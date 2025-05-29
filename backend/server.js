require('dotenv').config();
const express = require('express');
const app = express();
const webhookServer = require('./webhooks');

app.use(express.json());

// Routes
const ethRouter = require('./routes/ethereum');
app.use('/api/nodit', ethRouter); // Updated endpoint

const loggerRouter = require('./routes/logger');
app.use('/api/logger', loggerRouter);

// Start webhook server
webhookServer.listen(3001, () => {
  console.log('Webhook server running on port 3001');
});

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});