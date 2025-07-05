const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getApiCache, setApiCache } = require('../utils/db');
const { executeEthContract, executeTronContract, executeXrplContract } = require('./contract.js')
const { resolveTokenAddress } = require("./resolve.js")

// Unified blockchain API handler
router.post('/nodit-api', async (req, res) => {
  const { api, params, chain } = req.body;
  
  if (!api || !params || !chain) {
    return res.status(400).json({ error: 'Missing API parameters' });
  }

  const validateChain = (chain) => {
    const validChains = [
      'ethereum/mainnet', 
      'tron/mainnet',
      'xrpl/mainnet',
      'bitcoin/mainnet',
      'dogecoin/mainnet'
    ];
    return validChains.includes(chain);
  };

  if (!validateChain(chain)) {
    return res.status(400).json({ error: 'Unsupported blockchain network' });
  }

  try {
    const cacheKey = `${chain}:${api}:${JSON.stringify(params)}`;
    const cached = await getApiCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Chain-specific handling
    let url, body, contractAddress, headers = { 'X-API-KEY': process.env.NODIT_API_KEY };

    const noditClient = axios.create({
      baseURL: 'https://web3.nodit.io/v1/',
      headers: { 'X-API-KEY': process.env.NODIT_API_KEY },
      timeout: 10000
    });
    
    switch (chain.split('/')[0]) {
      case 'ethereum':
        switch(api) {
          case 'getTokenTransfersByAccount':
            url = 'ethereum/mainnet/token/getTokenTransfersByAccount';
            body = { 
              accountAddress: params.accountAddress,
              fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              toDate: new Date().toISOString(),
              page: params.page || 1,  // Add pagination
              limit: params.limit || 20
            };
            break;
          case 'getTokenPricesByContracts':
            url = 'ethereum/mainnet/token/getTokenPricesByContracts';
            const tokenSymbol = params.tokenName;
            contractAddress = tokenSymbol 
              ? await resolveTokenAddress(tokenSymbol)
              : params.contractAddress;
            if (!contractAddress) {
              return res.status(400).json({ 
                error: `Token "${tokenSymbol}" not found. Recheck or Provide contract address instead.` 
              });
            }
            body = { 
              contractAddresses: [contractAddress]
            };
            break;
          case 'getNftMetadataByTokenIds':
            if (!params.contractAddress || !params.tokenId) {
              return res.status(400).json({
                error: 'Missing contractAddress or tokenId for NFT lookup'
              });
            }
            url = 'ethereum/mainnet/nft/getNftMetadataByTokenIds';
            body = {
              tokens: [
                {
                  contractAddress: params.contractAddress,
                  tokenId: params.tokenId,
                },
              ]
            }
            break;
          case 'getDailyTransactionsStats':
            url = 'ethereum/mainnet/stats/getDailyTransactionsStats';
            body = {
              startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            };
            break;
          default:
            return res.status(400).json({ error: 'Unsupported API method for Ethereum' });
        }
        break;
      
      case 'xrpl':
        url = `xrpl/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;

      case 'tron':
        url = `tron/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;
      
      case 'bitcoin':
        url = `bitcoin/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;

      case 'dogecoin':
        url = `dogecoin/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported blockchain' });
    }

    console.log(url,body,{headers});

    const response = await noditClient.post(url, body);
    const result = response.data;

    // Cache for 5 minutes
    await setApiCache(cacheKey, result, 300);
    
    res.json(result);
  } catch (error) {
    console.error('Nodit API Error:', error.response?.data || error.message);
    const errorResponse = {
      error: 'Nodit API request failed',
      details: error.response?.data?.error || error.message,
      statusCode: error.response?.status || 500,
      api,
      params,
      chain
    };
   
    res.status(errorResponse.statusCode).json(errorResponse);
  }
});

router.post('/execute-contract', async (req, res) => {
  const { contractAddress, functionName, params, value, chain, userAddress } = req.body;
  
  try {
    let result;
    switch(chain) {
      case 'ethereum/mainnet':
        result = await executeEthContract(contractAddress, functionName, params, value, userAddress);
        break;
      case 'tron/mainnet':
        result = await executeTronContract(contractAddress, functionName, params, userAddress);
        break;
      case 'xrpl/mainnet':
        result = await executeXrplContract(contractAddress, functionName, params, userAddress);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported chain for contract execution' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Contract execution failed', details: error.message });
  }
});

module.exports = router;