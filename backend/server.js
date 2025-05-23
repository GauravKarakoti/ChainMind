require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// Routes
const ethRouter = require('./routes/ethereum');
app.use('/api/ethereum', ethRouter);

// Webhooks
require('./webhooks');

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});