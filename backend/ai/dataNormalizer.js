/**
 * Normalizes raw API data into a structured format for the frontend dashboard.
 * @param {string} api - The Nodit API method that was called.
 * @param {string} chain - The blockchain network.
 * @param {object} rawData - The raw data returned from the Nodit API.
 * @returns {object} A structured object with a `type` and `items` array.
 */
function normalizeResponseData(api, chain, rawData) {
    const chainName = chain.split('/')[0];

    if (!rawData || (!rawData.items && !Array.isArray(rawData))) {
        return { type: 'empty', items: [] };
    }

    switch (api) {
        case 'getTokenTransfersByAccount':
        case 'getTransactionsByAccount':
            switch (chainName) {
                case 'ethereum':
                    return {
                        type: 'transfers',
                        items: rawData.items?.map(t => ({
                            token: t.contract?.symbol || 'ETH',
                            amount: t.value / Math.pow(10, t.contract?.decimals || 18),
                            from: t.from,
                            to: t.to,
                            timestamp: t.timestamp,
                            transactionHash: t.transactionHash
                        })) || []
                    };
                case 'xrpl':
                    return {
                        type: 'transfers',
                        items: rawData.items?.map(t => ({
                            token: t.transactionType,
                            amount: parseFloat(t.fee),
                            from: t.account,
                            to: t.destination || 'N/A',
                            timestamp: t.ledgerTimestamp,
                            transactionHash: t.transactionHash
                        })) || []
                    };
                case 'tron':
                     return {
                        type: 'transfers',
                        items: rawData.items?.map(t => ({
                            token: t.type || 'TRX',
                            amount: t.value || 0,
                            from: t.fromAddress,
                            to: t.toAddress || 'N/A',
                            timestamp: t.timestamp,
                            transactionHash: t.transactionHash
                        })) || []
                    };
                case 'bitcoin':
                case 'dogecoin':
                    return {
                        type: 'transfers',
                        items: rawData.items?.map(t => ({
                            token: t.vin.length >= t.vout.length ? 'INPUT' : 'OUTPUT',
                            amount: Math.abs((t.vout?.length || 0) - (t.vin?.length || 0)),
                            from: t.vin?.[0]?.addresses?.[0] || 'Multiple Inputs',
                            to: t.vout?.[0]?.addresses?.[0] || 'Multiple Outputs',
                            timestamp: t.blockTimestamp,
                            transactionHash: t.hash
                        })) || []
                    };
                default:
                    return { type: 'raw', items: rawData };
            }

        case 'getDailyTransactionsStats':
            return {
                type: 'stats',
                items: rawData.items?.map(stat => ({
                    date: stat.date,
                    count: stat.count
                })) || []
            };

        case 'getTokenPricesByContracts':
            return {
                type: 'prices',
                items: rawData.map(price => ({
                    price: price.price,
                    changes: {
                        '1h': price.percentChangeFor1h,
                        '24h': price.percentChangeFor24h,
                        '7d': price.percentChangeFor7d
                    }
                }))
            };

        case 'getNftMetadataByTokenIds':
            return {
                type: 'nft',
                items: rawData.items?.map(nft => ({
                    contract: nft.contract,
                    tokenId: nft.tokenId,
                    logoUrl: nft.contract?.logoUrl,
                    tokenUri: nft.tokenUri,
                    rawMetadata: nft.rawMetadata
                })) || []
            };

        default:
            return { type: 'raw', items: rawData };
    }
}

module.exports = { normalizeResponseData };