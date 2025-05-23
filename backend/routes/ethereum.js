const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/transfers', async (req, res) => {
  const { accountAddress } = req.body;
  try {
    const response = await axios.post(
      'https://web3.nodit.io/v1/ethereum/mainnet/token/getTokenTransfersByAccount',
      { accountAddress },
      { headers: { 'X-API-KEY': process.env.NODIT_API_KEY } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

module.exports = router;