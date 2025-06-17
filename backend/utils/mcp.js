const { parse_query } = require('../ai/langchainHandler');

// Handle ambiguous queries using LangChain
async function resolveAmbiguousQuery(params) {
  // Use LangChain for complex resolution
  if (params.tokenSymbol && !params.tokenAddress) {
    const query = `Resolve token address for ${params.tokenSymbol}`;
    const resolution = await parse_query(query);
    return { ...params, ...resolution.params };
  }
  
  return params;
}

module.exports = { resolveAmbiguousQuery };