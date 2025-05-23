require('dotenv').config();
import axios from 'axios';

export default async function handler(req, res) {
  try {
    console.log('REQ.BODY:', req.body);
    const { query } = req.body;
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "query" field' });
    }

    const ethAddressRegex = /0x[a-fA-F0-9]{40}/;
    const matches = query.match(ethAddressRegex);
    if (!matches) {
      return res.status(400).json({ error: 'No valid Ethereum address found in query' });
    }
    const address = matches[0];

    // Fetch token transfers
    const transfersResponse = await axios.post(
      'https://web3.nodit.io/v1/ethereum/mainnet/token/getTokenTransfersByAccount',
      {
        accountAddress: address,
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        toDate: new Date().toISOString()
      },
      { headers: { 'X-API-KEY': process.env.NODIT_API_KEY } }
    );

    // Process transfers
    const transferItems = transfersResponse.data.items || []; // fall back to empty array if undefined
    console.log(transferItems)
    const transfers = transferItems.map(t => ({
      token: t.contract.symbol,
      contractAddress: t.contract.address,
      amount: t.value / Math.pow(10, t.tokenDecimal || 18),
    }));
    console.log(transfers)

    return res.status(200).json({
      address,
      transfers,
      summary: {
        totalTokens: [...new Set(transfers.map(t => t.token))].length,
      }
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: 'Blockchain analysis failed',
      details: err.response?.data?.error || err.message
    });
  }
}