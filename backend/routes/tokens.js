const express = require('express');
const axios = require('axios');
const router = express.Router();

const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = process.env.COINMARKETCAP_API_KEY;
if (!API_KEY) {
  console.warn(
    '[tokens.js] No CMC_API_KEY set in environment—token endpoint will fail.'
  );
}

router.get('/', async (req, res) => {
  try {
    // Get top 100 tokens by market cap
    const listRes = await axios.get(
      `${CMC_BASE}/cryptocurrency/listings/latest`,
      {
        params: {
          start: 1,
          limit: 100,
          convert: 'USD',
        },
        headers: {
          'X-CMC_PRO_API_KEY': API_KEY,
        },
        timeout: 5000,
      }
    );

    const coins = listRes.data.data;
    const ids = coins.map((c) => c.id).join(',');

    // Fetch metadata (including logo) for those IDs
    const infoRes = await axios.get(
      `${CMC_BASE}/cryptocurrency/info`,
      {
        params: { id: ids },
        headers: {
          'X-CMC_PRO_API_KEY': API_KEY,
        },
        timeout: 5000,
      }
    );

    const info = infoRes.data.data;

    // Merge into the shape your frontend expects
    const tokens = coins.map((coin) => ({
      symbol: coin.symbol,
      name: coin.name,
      logo: info[coin.id]?.logo || '',
      // CMC doesn't give you the on‑chain address here;
      // if you need that, you'd have to source it elsewhere or drop it.
      address: '',
    }));

    return res.status(200).json(tokens);
  } catch (error) {
    console.error('Token fetch error:', error.response?.data || error.message);
    const status = error.response?.status || 502;
    const msg = error.response?.data?.status?.error_message || error.message;
    return res.status(status).json({
      error: 'Failed to fetch tokens from CMC',
      details: msg,
    });
  }
});

module.exports = router;