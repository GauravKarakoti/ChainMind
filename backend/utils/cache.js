const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

async function getETHPrice() {
  let price = cache.get('ethPrice');
  if (!price) {
    price = await fetchCoingeckoPrice('ethereum');
    cache.set('ethPrice', price);
  }
  return price;
}