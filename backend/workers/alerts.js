// Add to top of file
const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY;
const QUICKNODE_URL = process.env.QUICKNODE_URL;
const { db } = require('../utils/db');
const axios = require("axios")
const { resolveTokenAddress } = require("../routes/resolve.js")

// Updated getAlertsByType function
async function getAlertsByType(type) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM alerts WHERE type = ? AND is_active = 1',
      [type],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Improved fetchEthGasPrice using QuickNode
async function fetchEthGasPrice() {
  try {
    // Use QuickNode's eth_gasPrice method
    const response = await axios.post(QUICKNODE_URL, {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1
    });
    
    // Convert from wei to gwei
    const gasPriceWei = parseInt(response.data.result, 16);
    return gasPriceWei / 1e9;
  } catch (error) {
    console.error('Failed to fetch ETH gas price:', error);
    
    // Fallback to Etherscan
    try {
      const fallback = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY
        }
      });
      return parseFloat(fallback.data.result.ProposeGasPrice);
    } catch (fallbackError) {
      return 0;
    }
  }
}

// Improved fetchLargeTransfers using Bitquery
async function fetchLargeTransfers(chain, token, threshold) {
  try {
    // Map chain to Bitquery network name
    const networkMap = {
      'ethereum/mainnet': 'ethereum',
      'bitcoin/mainnet': 'bitcoin',
      'tron/mainnet': 'tron',
      'xrpl/mainnet': 'xrpl',
      'dogecoin/mainnet': 'dogecoin'
    };
    
    const network = networkMap[chain];
    if (!network) {
      console.warn(`Bitquery not supported for ${chain}`);
      return [];
    }

    // Get token contract address if needed
    let tokenAddress = null;
    if (token !== 'native') {
      tokenAddress = await resolveTokenAddress(token);
      if (!tokenAddress) {
        console.warn(`Token address not found for ${token}`);
        return [];
      }
    }

    // Build GraphQL query based on chain
    let query, variables;
    if (network === 'ethereum') {
      [query, variables] = buildEthereumQuery(network, tokenAddress, threshold);
    } else if (network === 'bitcoin') {
      [query, variables] = buildBitcoinQuery(network, threshold);
    } else {
      [query, variables] = buildGenericQuery(network, tokenAddress, threshold);
    }

    let data = JSON.stringify({query,variables});
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://streaming.bitquery.io/eap',
      headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${BITQUERY_API_KEY}`
      },
      data : data
    };

    axios.request(config).then((response) => {
      return processBitqueryResponse(response.data, network);
    }).catch((error) => {
      console.log(error);
    });
    return [];
  } catch (error) {
    console.error('Failed to fetch large transfers:', error);
    return [];
  }
}

// Helper functions for Bitquery
function buildEthereumQuery(network, tokenAddress, threshold) {
  const query = `
    query ($network: EthereumNetwork!, $token: String, $threshold: Float!) {
      ethereum(network: $network) {
        transfers(
          currency: {is: $token}
          amount: {gt: $threshold}
          options: {desc: "block.timestamp.time", limit: 10}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
          }
          sender {
            address
          }
          receiver {
            address
          }
          transaction {
            hash
          }
          amount
          currency {
            symbol
          }
        }
      }
    }
  `;
  
  const variables = {
    network,
    token: tokenAddress,
    threshold
  };
  
  return [query, variables];
}

function buildBitcoinQuery(network, threshold) {
  const query = `
    query ($network: BitcoinNetwork!, $threshold: Float!) {
      bitcoin(network: $network) {
        inputs(
          inputValue: {gt: $threshold}
          options: {desc: "timestamp", limit: 10}
        ) {
          timestamp {
            time(format: "%Y-%m-%d %H:%M:%S")
          }
          address: outputAddress {
            address
          }
          value
          transaction {
            hash
          }
        }
      }
    }
  `;
  
  const variables = {
    network,
    threshold
  };
  
  return [query, variables];
}

function buildGenericQuery(network, tokenAddress, threshold) {
  const query = `
    query ($network: ${network.charAt(0).toUpperCase() + network.slice(1)}Network!, $threshold: Float!) {
      ${network}(network: $network) {
        transfers(
          amount: {gt: $threshold}
          options: {desc: "block.timestamp.time", limit: 10}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
          }
          sender {
            address
          }
          receiver {
            address
          }
          transaction {
            hash
          }
          amount
          currency {
            symbol
          }
        }
      }
    }
  `;
  
  const variables = {
    network,
    threshold
  };
  
  return [query, variables];
}

function processBitqueryResponse(data, network) {
  if (network === 'bitcoin') {
    return data?.data?.bitcoin?.inputs?.map(tx => ({
      timestamp: tx.timestamp.time,
      from: tx.address.address,
      to: '', // Not available in inputs
      hash: tx.transaction.hash,
      amount: tx.value,
      currency: 'BTC'
    })) || [];
  }
  
  const transfers = data?.data?.[network]?.transfers || [];
  return transfers.map(tx => ({
    timestamp: tx.block.timestamp.time,
    from: tx.sender.address,
    to: tx.receiver.address,
    hash: tx.transaction.hash,
    amount: tx.amount,
    currency: tx.currency.symbol
  }));
}

// Improved fetchAccountActivity using Alchemy
async function fetchAccountActivity(chain, accountAddress) {
  try {
    // Map chain to Alchemy network
    const networkMap = {
      'ethereum/mainnet': 'eth-mainnet',
      'polygon/mainnet': 'polygon-mainnet',
      'arbitrum/mainnet': 'arb-mainnet',
      'optimism/mainnet': 'opt-mainnet'
    };
    
    const network = networkMap[chain];
    if (!network) {
      // Fallback to Nodit API
      return fallbackAccountActivity(chain, accountAddress);
    }

    const response = await axios.post(
      `https://${network}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      {
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x' + (Math.floor(Date.now() / 1000) - 86400).toString(16), // Last 24 hours
          toAddress: accountAddress,
          category: ['external', 'internal', 'erc20', 'erc721', 'erc1155']
        }],
        id: 1
      }
    );

    return response.data.result.transfers.length || 0;
  } catch (error) {
    console.error('Failed to fetch account activity with Alchemy:', error);
    return fallbackAccountActivity(chain, accountAddress);
  }
}

// Fallback method using Nodit API
async function fallbackAccountActivity(chain, accountAddress) {
  try {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await axios.post('/api/nodit/nodit-api', {
      api: 'getTransactionsByAccount',
      params: { accountAddress },
      chain
    });

    return response.data.items.filter(tx => 
      new Date(tx.timestamp || tx.blockTimestamp) > new Date(startTime)
    ).length;
  } catch (error) {
    console.error('Fallback account activity failed:', error);
    return 0;
  }
}

module.exports = {
    getAlertsByType,
    fetchEthGasPrice,
    fetchLargeTransfers,
    fetchAccountActivity
}