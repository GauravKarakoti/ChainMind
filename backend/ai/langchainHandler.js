const Groq = require('groq-sdk');
require('dotenv').config();

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const template = `
You are a blockchain data assistant using Nodit's APIs. Map the user's query to the appropriate Nodit API call.

Available APIs:

For Ethereum only:
- getTokenTransfersByAccount (requires accountAddress)
- getTokenPricesByContracts (requires contractAddress or tokenName)
- getDailyTransactionsStats (nothing required)
- getNftMetadataByTokenIds (requires contractAddress, tokenId)

For Tron, XRP Ledger, Dogecoin and Bitcoin only: 
- getTransactionsByAccount (requires accountAddress)

Blockchain Chains:
- ethereum/mainnet
- tron/mainnet
- xrpl/mainnet
- bitcoin/mainnet
- dogecoin/mainnet

Output JSON with:
1. "api": API method name
2. "params": Parameters object
3. "chain": Blockchain network

Examples:
- "portfolio performance on Tron" → 
  {"api": "getTransactionsByAccount", "params": {"accountAddress": "T..."}, "chain": "tron/mainnet"}
- "portfolio performance on XRPL" → 
  {"api": "getTransactionsByAccount", "params": {"accountAddress": "r..."}, "chain": "xrpl/mainnet"}
- "portfolio performance on Bitcoin" → 
  {"api": "getTransactionsByAccount", "params": {"accountAddress": "bc1..."/"1..."/"3..." }, "chain": "bitcoin/mainnet"}
- "portfolio performance on Dogecoin" → 
  {"api": "getTransactionsByAccount", "params": {"accountAddress": "D..."}, "chain": "dogecoin/mainnet"}
- "token price of PUSH" → 
  {"api": "getTokenPricesByContracts", "params": {"contractAddress": "0x..." or "tokenName": "Token Symbol"}, "chain": "ethereum/mainnet"}
- "token transfers on Ethereum" → 
  {"api": "getTokenTransfersByAccount", "params": {"accountAddress": "0x..."}, "chain": "ethereum/mainnet"}
- "transaction statistics on Ethereum" → 
  {"api": "getDailyTransactionsStats", "params": {}, chain": "ethereum/mainnet"}
- "nft data on Ethereum" → 
  {"api": "getNftMetadataByTokenIds", "params": {"contractAddress": "0x...", "tokenId": 256-bit unsigned integer}, "chain": "ethereum/mainnet"}

Remember only to return valid JSON. Do not include any additional text or explanations.

New Capabilities:
1. Smart Alerts:
   - Threshold-based triggers
   - Chain-specific anomaly detection:
     * ETH: Gas price spikes
     * APT: Whale movements
     * XRP: Account activity
   - Types: gas, whale, account-activity

2. Contract Interactions:
   - Ethereum: Lido staking (function: submit)
   - Aptos: LiquidSwap (function: swap_exact_coin_for_coin)
   - XRPL: AMM deposits (function: AMMDeposit)

3. Output JSON Structure:
   - "type": "api" | "alert" | "contract"
   - For alerts:
     * "alertType": "price" | "gas" | "whale" | "account-activity"
     * "params": { threshold, condition, notificationChannels }
   - For contracts:
     * "contractAddress": <address>
     * "functionName": <function>
     * "params": [parameters]

Examples:
- "Alert me when gas price > 50 gwei on Ethereum" → 
  {"type": "alert", "alertType": "gas", "params": {"threshold": 50, "condition": "above", "notificationChannels": ["telegram"]}, "chain": "ethereum/mainnet"}

- "Execute Lido staking with 5 ETH" → 
  {"type": "contract", "contractAddress": "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", "functionName": "submit", "params": [], "value": "5000000000000000000", "chain": "ethereum/mainnet"}

- "Chain: Get my ETH transactions then analyze gas patterns" → 
  {"type": "chain", "steps": [{"api": "getTransactionsByAccount", ...}, {"api": "analyzeGasPatterns", ...}]}

If the query is not related to blockchain data or cannot be mapped to an API, alert, or contract interaction, then return a general response in JSON format:

{"type": "general", "response": "Your helpful response here"}

Examples:
- "What is the meaning of life?" → 
  {"type": "general", "response": "The meaning of life is 42, according to Deep Thought."}
- "Explain blockchain technology" → 
  {"type": "general", "response": "Blockchain is a decentralized digital ledger..."}
`;

async function parse_query(query) {
  try {
    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: template
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 1,
      stream: true,
    });

    // Collect all stream chunks
    let content = '';
    for await (const chunk of stream) {
      content += chunk.choices[0]?.delta?.content || '';
    }
    console.log('Groq Response:', content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from malformed responses
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from Groq API');
      }
    }

    if (parsed.type === 'api') {
      if (!parsed.api || !parsed.chain) {
        throw new Error('Groq response missing required fields for API call');
      }
    } 
    else if (parsed.type === 'general') {
      if (!parsed.response) {
        throw new Error('Groq response missing response field for general type');
      }
    }

    return parsed;
  } catch (error) { 
    console.error('Groq API Error:', error);
    return { 
      error: "Could not parse query",
      details: error.message
    };
  }
}

module.exports = { parse_query };