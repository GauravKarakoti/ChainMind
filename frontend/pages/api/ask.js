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

    // Get AI interpretation of query
    const aiResponse = await axios.post(
      // 'http://localhost:4000/api/ai/parse-query',
      'https://chainmind-backend.onrender.com/api/ai/parse-query',
      { query, userIp }
    );
    const { api, params, chain } = aiResponse.data;
    console.log('AI Response:', { api, params, chain });

    // Call Nodit API through our backend
    const noditResponse = await axios.post(
      // 'http://localhost:4000/api/nodit/nodit-api',
      'https://chainmind-backend.onrender.com/api/nodit/nodit-api',
      { api, params, chain }
    );
    console.log('Nodit Response:', noditResponse.data);

    const payload = Array.isArray(noditResponse.data.items)
      ? noditResponse.data.items
      : noditResponse.data;

    // Format response for frontend
    let result = {
      data: noditResponse.data,
      chain,
      api
    };

    const items = payload;
    let grouped = {};
    // Map raw transfers per chain
    switch (api) {
      case 'getTokenTransfersByAccount':
      case 'getTransactionsByAccount':
        switch (chain) {
          case 'ethereum/mainnet':
            result.transfers = items.map(t => ({
              token: t.contract?.symbol,
              contractAddress: t.contract?.address,
              amount: t.normalizedAmount != null
                ? t.normalizedAmount
                : t.value / Math.pow(10, t.tokenDecimal || 18),
              from: t.from,
              to: t.to,
              timestamp: t.timestamp,
              transactionHash: t.transactionHash
            }));
            break;
          case 'xrpl/mainnet':
            result.transfers = items.map(t => ({
              token: t.transactionType,
              amount: parseFloat(t.fee),
              from: t.account,
              to: t.destination || null,
              timestamp: t.ledgerTimestamp,
              transactionHash: t.transactionHash
            }));
            break;
          case 'tron/mainnet':
            result.transfers = items.map(t => ({
              token: t.type,
              amount: t.value,
              from: t.account,
              to: t.toAddress || null,
              timestamp: t.ledgerTimestamp,
              transactionHash: t.transactionHash
            }));
            break;
          case 'bitcoin/mainnet':
          case 'dogecoin/mainnet':
            result.transfers = items.map(t => ({
              token: t.vin.length >= t.vout.length ? 'input' : 'output',
              amount: Math.abs(t.vout.length - t.vin.length),
              timestamp: t.blockTimestamp,
              transactionHash: t.hash
            }));
            break;
          default:
            return res.status(400).json({ error: 'Unsupported blockchain' });
        }

        // Aggregate transfers by token
        grouped = result.transfers.reduce((acc, tx) => {
          if (!acc[tx.token]) {
            acc[tx.token] = { ...tx };
          } else {
            acc[tx.token].amount += tx.amount;
          }
          return acc;
        }, {});

        result.transfers = Object.values(grouped);

        // Summary
        result.summary = {
          totalTokens: result.transfers.length,
          totalValue: result.transfers.reduce((sum, t) => sum + t.amount, 0)
        };
        break;
      case 'getDailyTransactionsStats':
        result.dailyStats = items.map(d => ({
          date: d.date,
          count: d.count
        }));
        break;
      case 'getTokenPricesByContracts':
        result.tokenPrices = items.map(t => ({
          percentChangeFor1h: t.percentChangeFor1h,
          percentChangeFor24h: t.percentChangeFor24h,
          percentChangeFor7d: t.percentChangeFor7d,
          price: t.price
        }));
        break;
      case 'getNFTMetadataByContracts':
        result.nftMetadata = items
        break;
      default:
        console.error('Unknown API:', api);
    }

    // Log via backend API
    // await axios.post('http://localhost:4000/api/logger/log-query', {
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
    // await axios.post('http://localhost:4000/api/logger/log-query', {
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
