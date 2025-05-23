const express = require('express');
const app = express();
app.use(express.json());

// Endpoint to receive Nodit Webhook events
app.post('/webhook/erc20-alerts', (req, res) => {
  const { transaction } = req.body;
  if (transaction.valueUSD > 10000) {
    sendEmailAlert(transaction); // Integrate SendGrid/Nodemailer
  }
  res.status(200).end();
});

app.listen(3001, () => console.log('Webhook server running on port 3001'));