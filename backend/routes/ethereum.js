const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getETHPrice } = require('../utils/cache');
const { getApiCache, setApiCache } = require('../utils/db');

// Unified API handler
router.post('/nodit-api', async (req, res) => {
  const { accountAddress } = req.body;
  
  if (!accountAddress) {
    return res.status(400).json({ error: 'Missing API parameters' });
  }

  try {
    const cached = await getApiCache(accountAddress);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.post(
      'https://web3.nodit.io/v1/ethereum/mainnet/token/getTokenTransfersByAccount',
      {
        accountAddress: accountAddress,
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        toDate: new Date().toISOString()
      },
      { headers: { 'X-API-KEY': process.env.NODIT_API_KEY } }
    );
    
    // Post-processing
    let result = response.data;
    
    await setApiCache(accountAddress, response.data, 300);

    result.items = result.items.map(t => ({
      ...t,
      normalizedAmount: t.value / Math.pow(10, t.tokenDecimal)
    }));

    res.json(result);
  } catch (error) {
    console.error('Nodit API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Nodit API request failed',
      details: error.response?.data?.error || error.message
    });
  }
});

module.exports = router;