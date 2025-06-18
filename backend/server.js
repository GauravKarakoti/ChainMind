require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Add CORS module
const app = express();
const webhookServer = require('./webhooks');

const PORT = 4000;
const WEBHOOK_PORT = 3001;

// Configure CORS middleware
const corsOptions = {
  origin: '*', // Allow all origins (replace with your frontend URL in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'], // Allowed headers
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200 // For legacy browser support
};

// Apply CORS middleware
app.use(cors(corsOptions));
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

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

webhookServer.listen(WEBHOOK_PORT, () => {
  console.log(`Webhook server running on port ${WEBHOOK_PORT}`);
});