const NodeCache = require('node-cache');
const axios = require('axios');
const { createEventLog } = require('./db');

const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

// Alternative data sources
const api = {
  name: 'CoinMarketCap',
  url: (tokenId) => `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tokenId}`,
  parse: (res) => {
    const key = Object.keys(res.data.data)[0];
    return res.data.data[key]?.quote?.USD?.price;
  },
  headers: {
    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
  }
}

// Rate-limited request helper
async function makeRateLimitedRequest(url, headers = {}) {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  
  // Enforce rate limiting
  if (timeSinceLast < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLast));
  }
  
  lastRequestTime = Date.now();
  return axios.get(url, {
    headers: {
      'User-Agent': 'ChainMind/1.0',
      ...headers
    }
  });
}

async function fetchTokenPrice(tokenId) {
  const cacheKey = `${tokenId}_price`;
  const cachedPrice = cache.get(cacheKey);
  if (cachedPrice !== undefined) return cachedPrice;
  
  try {      
    console.log(api)
    const response = await makeRateLimitedRequest(api.url(tokenId), api.headers);
    const price = parseFloat(api.parse(response, tokenId));
    console.log(response.data,price)
    
    if (price && !isNaN(price)) {
      cache.set(cacheKey, price);
      
      // Log successful fetch
      await createEventLog({
        type: 'price_fetch',
        status: 'success',
        source: api.name,
        token: tokenId,
        price
      });
      
      return price;
    }
  } catch (error) {
    // Log API failures
    await createEventLog({
      type: 'price_fetch',
      status: 'failed',
      source: api.name,
      token: tokenId,
      error: error.message
    });
    
    console.error(`${api.name} Error:`, error.message);
  }
  
  // Fallback to cached value if available
  const fallback = cache.get('fallback_' + tokenId) || 0;
  console.warn(`All price APIs failed for ${tokenId}. Using fallback value:`, fallback);
  return fallback;
}

// Get token price with caching
async function getTokenPrice(tokenId) {
  try {
    return await fetchTokenPrice(tokenId.toLowerCase());
  } catch (error) {
    console.error('Price fetch failed:', error);
    return 0;
  }
}

module.exports = { getTokenPrice };