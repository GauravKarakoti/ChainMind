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

    // Validate required fields
    if (!parsed.api || !parsed.chain) {
      throw new Error('Groq response missing required fields');
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