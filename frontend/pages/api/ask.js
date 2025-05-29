require('dotenv').config();
import axios from 'axios';

export default async function handler(req, res) {
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('REQ.BODY:', req.body);
  const { query } = req.body;

  try {
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
    
    // Call Nodit API through our backend
    const noditResponse = await axios.post(
      'https://chainmind-backend.onrender.com/api/nodit/nodit-api',
      { accountAddress: address }
    );
    
    // Format response for frontend
    let result = { data: noditResponse.data };
    
    // Add additional processing 
    result.summary = {
      totalTokens: [...new Set(noditResponse.data.items.map(t => t.token))].length,
      totalValueUSD: noditResponse.data.items.reduce((sum, t) => sum + (t.valueUSD || 0), 0)
    };

    const transferItems = noditResponse.data.items || []; // fall back to empty array if undefined
    console.log(transferItems)
    const transfers = transferItems.map(t => ({
      token: t.contract.symbol,
      contractAddress: t.contract.address,
      amount: t.value / Math.pow(10, t.tokenDecimal || 18),
    }));
    console.log(transfers)

    result.transfers = transfers;
    
    // Log via backend API
    await axios.post('https://chainmind-backend.onrender.com/api/logger/log-query', {
      query,
      response: result,
      userIp,
      error: null
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('API Error:', err);

    // Log error via backend API
    await axios.post('https://chainmind-backend.onrender.com/api/logger/log-query', {
      query,
      response: null,
      userIp,
      error: err.message
    }).catch(logErr => console.error('Logging failed:', logErr));

    return res.status(500).json({ 
      error: 'Blockchain analysis failed',
      details: err.response?.data?.error || err.message
    });
  }
}