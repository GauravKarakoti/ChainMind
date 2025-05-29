const NodeCache = require('node-cache');
const axios = require('axios');
const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

async function fetchCoingeckoPrice(tokenId) {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    return response.data[tokenId].usd;
  } catch (error) {
    console.error('CoinGecko Error:', error);
    return 0;
  }
}

async function getTokenPrice(tokenId) {
  const cacheKey = `${tokenId}_price`;
  let price = cache.get(cacheKey);
  
  if (!price) {
    price = await fetchCoingeckoPrice(tokenId);
    cache.set(cacheKey, price);
  }
  
  return price;
}

module.exports = { getTokenPrice, fetchCoingeckoPrice };