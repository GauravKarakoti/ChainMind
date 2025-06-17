const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getApiCache, setApiCache } = require('../utils/db');
const { normalizeChainData } = require('../utils/normalize');

const tokens = {
  "AAVE": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  "ACH": "0x5Ca9a71B1d01849C0a95490Cc00559717fCf0D1d",
  "ADA": "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
  "ALPHA": "0xa1faa113cbe53436df28ff0aee54275c13b40975",
  "AMB": "0x4DC3643dbc642b72c158e7f3d2ff232df61cb6ce",
  "ANKR": "0xE95A203B1a91a908F9B9CE46459d101078c2c3cb",
  "APE": "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
  "ARMOR": "0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce",
  "AST": "0x27054b13b1b798b345b591a4d22e6562d47ea75a",
  "BADGER": "0x3472A5A71965499acd81997a54BBA8D852C6E53d",
  "BAT": "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
  "BCD": "0xf859Bf77cBe8699013d6Dbc7C2b926Aaf307F830",
  "BNT": "0x1f573D6Fb3F13d689FF844B4cE463F112f7A121d",
  "BNB": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
  "CAKE": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  "COMP": "0xc00e94Cb662C3520282E6f5717214004A7f26888",
  "CRV": "0xD533a949740bb3306d119CC777fa900bA034cd52",
  "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  "DOGE": "0xba2ae424d960c26247dd6c32edc70b295c744c43",
  "DOT": "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
  "ENJ": "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c",
  "ETH": "0x0000000000000000000000000000000000000000",
  "FIL": "0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153",
  "FTM": "0x4e15361fd6b4bb609fa63c81a2be19d873717870",
  "GRT": "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
  "IMX": "0xf52cdcd458bf455aed77751743180ec4a595fd3f",
  "IOST": "0xfa1faec8a141d4bde83ea4f2421d0c8f61f5702f",
  "KNC": "0xdd974d5c2e2928dea5f71b9825b8b646686bd200",
  "LINK": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  "LRC": "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd",
  "MANA": "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
  "MATIC": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  "MKR": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
  "OCEAN": "0x967da4048cd07ab37855c090aaf366e4ce1b9f48",
  "OMG": "0xd26114cd6ee289accf82350c8d8487fedb8a0c07",
  "REN": "0x408e41876cCCDC0F92210600ef50372656052a38",
  "SHIB": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  "SNX": "0xC011A72400E58ecD99Ee497CF89E3775d4bd732F",
  "SOL": "0x0000000000000000000000000000000000000000",
  "SRM": "0xb9e7f8568e08d5659f5d29c4997173d84cdf2607",
  "STORJ": "0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC",
  "SUSHI": "0x6B3595068778DD592e39A122f4f5a5Cf09C90fE2",
  "SXP": "0x47BEAd2563dCBf3bF1B0Be9D9F9d1833D4F7D13F",
  "TRX": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "UNI": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "VET": "0xD850942eF8811f2A866692A623011bDE52a462C1",
  "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "YFI": "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
  "ZRX": "0xE41d2489571d322189246DaFA5ebDe1F4699F498"
}

// Unified blockchain API handler
router.post('/nodit-api', async (req, res) => {
  const { api, params, chain } = req.body;
  
  if (!api || !params || !chain) {
    return res.status(400).json({ error: 'Missing API parameters' });
  }

  try {
    const cacheKey = `${chain}:${api}:${params}`;
    const cached = await getApiCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Chain-specific handling
    let url, body, contractAddress, headers = { 'X-API-KEY': process.env.NODIT_API_KEY };
    
    switch (chain.split('/')[0]) {
      case 'ethereum':
        switch(api) {
          case 'getTokenTransfersByAccount':
            url = 'https://web3.nodit.io/v1/ethereum/mainnet/token/getTokenTransfersByAccount';
            body = { 
              accountAddress: params.accountAddress,
              fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              toDate: new Date().toISOString()
            };
            break;
          case 'getTokenPricesByContracts':
            url = 'https://web3.nodit.io/v1/ethereum/mainnet/token/getTokenPricesByContracts';
            contractAddress = params.tokenName? tokens[params.tokenName.toUpperCase()] : params.contractAddress;
            body = { 
              contractAddresses: [contractAddress]
            };
            break;
          case 'getNftMetadataByTokenIds':
            url = 'https://web3.nodit.io/v1/ethereum/mainnet/nft/getNftMetadataByTokenIds';
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
            url = 'https://web3.nodit.io/v1/ethereum/mainnet/stats/getDailyTransactionsStats';
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
        url = `https://web3.nodit.io/v1/xrpl/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;

      case 'tron':
        url = `https://web3.nodit.io/v1/tron/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;
      
      case 'bitcoin':
        url = `https://web3.nodit.io/v1/bitcoin/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;

      case 'dogecoin':
        url = `https://web3.nodit.io/v1/dogecoin/mainnet/blockchain/getTransactionsByAccount`;
        body = {
          accountAddress: params.accountAddress,
        };
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported blockchain' });
    }

    console.log(url,body,{headers});

    const response = await axios.post(url, body, { headers : headers });
    let result = response.data;
    
    // Normalize data across chains
    result = normalizeChainData(api, chain, result);

    // Cache for 5 minutes
    await setApiCache(cacheKey, result, 300);
    
    res.json(result);
  } catch (error) {
    console.error('Nodit API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Nodit API request failed',
      details: error.response?.data?.error || error.message
    });
  }
});

module.exports = router;