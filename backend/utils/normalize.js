// Normalize data across different blockchains
function normalizeChainData(api, chain, data) {
    const chainType = chain.split('/')[0];
    
    switch(api) {
      case 'getAccountBalance':
        if (chainType === 'ethereum') {
          return {
            balance: data.balance,
            currency: 'ETH',
            normalized: data.balance / 1e18
          };
        } else if (chainType === 'aptos') {
          return {
            balance: data.coin_balance,
            currency: 'APT',
            normalized: data.coin_balance / 1e8
          };
        } else if (chainType === 'xrpl') {
          return {
            balance: data.result.account_data.Balance,
            currency: 'XRP',
            normalized: data.result.account_data.Balance / 1e6
          };
        } else if (chainType === 'bitcoin' || chainType === 'dogecoin') {
          return data.map(tx => ({
            hash: tx.hash,
            time: tx.blockTimestamp,
            inputs: tx.vin.map(input => ({
              address: input.address,
              value: input.value
            })),
            outputs: tx.vout.map(output => ({
              address: output.address,
              value: output.value
            }))
          }));
        }
        break;
      
      case 'getTokenTransfersByAccount':
        if (chainType === 'ethereum') {
          return data.items.map(t => ({
            ...t,
            normalizedAmount: t.value / Math.pow(10, t.tokenDecimal),
            chain: 'ethereum'
          }));
        } else if (chainType === 'aptos') {
          return data.transfers.map(t => ({
            from: t.sender,
            to: t.receiver,
            token: t.token_data.name,
            amount: t.amount,
            normalizedAmount: t.amount / Math.pow(10, t.token_data.decimals),
            chain: 'aptos'
          }));
        }
        break;
      
      default:
        return data;
    }
  }
  
  module.exports = { normalizeChainData };