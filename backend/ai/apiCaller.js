import axios from 'axios';
import { resolveTokenAddress } from '../routes/resolve.js';

const NODIT_API_BASE_URL = process.env.NODIT_API_BASE_URL || 'https://web3.nodit.io/v1';

export async function callNoditApi(method, params = {}, chain) {
  try {
    let url, body;
    const noditClient = axios.create({
        baseURL: NODIT_API_BASE_URL,
        headers: { 'X-API-KEY': process.env.NODIT_API_KEY },
        timeout: 10000
    });

    const chainPrefix = chain.split('/')[0];

    switch (chainPrefix) {
      case 'ethereum':
        switch(method) {
          case 'getTokenTransfersByAccount':
            url = 'ethereum/mainnet/token/getTokenTransfersByAccount';
            body = { 
              accountAddress: params.accountAddress,
              fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              toDate: new Date().toISOString()
            };
            break;
          case 'getTokenPricesByContracts':
            url = 'ethereum/mainnet/token/getTokenPricesByContracts';
            const contractAddress = await resolveTokenAddress(params.tokenName);
            if (!contractAddress) {
                throw new Error(`Token "${params.tokenName}" not found.`);
            }
            body = { contractAddresses: [contractAddress] };
            break;
          case 'getNftMetadataByTokenIds':
            url = 'ethereum/mainnet/nft/getNftMetadataByTokenIds';
            if (!params.contractAddress || !params.tokenId) {
                throw new Error('Missing contractAddress or tokenId for NFT lookup');
            }
            body = { tokens: [{ contractAddress: params.contractAddress, tokenId: params.tokenId }] };
            break;
          case 'getDailyTransactionsStats':
            url = 'ethereum/mainnet/stats/getDailyTransactionsStats';
            body = {
              startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              endDate: new Date().toISOString().slice(0, 10)
            };
            break;
          default:
            throw new Error(`Unsupported API method "${method}" for Ethereum`);
        }
        break;
      
      case 'xrpl':
      case 'tron':
      case 'bitcoin':
      case 'dogecoin':
        if (method !== 'getTransactionsByAccount') {
             throw new Error(`Unsupported API method "${method}" for ${chainPrefix}`);
        }
        url = `${chainPrefix}/mainnet/blockchain/getTransactionsByAccount`;
        body = { accountAddress: params.accountAddress };
        break;
      
      default:
        throw new Error(`Unsupported blockchain: ${chain}`);
    }

    const response = await noditClient.post(url, body);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error(`Error calling Nodit API [${method} on ${chain}]:`, errorMessage);
    throw new Error(`Nodit API error: ${errorMessage}`);
  }
}