const express = require('express');
const router = express.Router();
const { logQuery } = require('../utils/db');

router.post('/log-query', async (req, res) => {
  try {
    const { query, response, userIp, error } = req.body;
    const logId = await logQuery(query, response, userIp, error);
    res.json({ success: true, logId });
  } catch (err) {
    res.status(500).json({ error: 'Logging failed' });
    console.error('Logging Error:', err);
  }
});

module.exports = router;