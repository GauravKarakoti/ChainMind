const express = require('express');
const router = express.Router();
const { parse_query } = require('../ai/langchainHandler');
const { logQuery } = require('../utils/db');

router.post('/parse-query', async (req, res) => {
  console.log('REQ.BODY:', req.body);
  const { query, userIp } = req.body;
  
  try {
    // Validate input
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "query" field' });
    }

    // Use LangChain to parse query
    const result = await parse_query(query);
    
    // Log successful parse
    await logQuery(query, result, userIp, null, result.api, result.chain);
    
    res.json(result);
  } catch (error) {
    console.error('AI Parse Error:', error);
    
    // Log failed parse
    await logQuery(query, null, userIp, error.message, null, null);
    
    res.status(500).json({ 
      error: 'Query parsing failed',
      details: error.message
    });
  }
});

module.exports = router;