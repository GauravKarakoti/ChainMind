from langchain.prompts import PromptTemplate
from langchain_openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()

llm = OpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0.7,
    model_name="gpt-3.5-turbo"
)

template = """
You are a blockchain data assistant using Nodit's APIs. Map the user's query to the appropriate Nodit API call.

Available APIs:
- getTokenTransfersByAccount (requires accountAddress)
- getTopTokenHolders (requires tokenAddress)
- getPriceHistory (requires tokenSymbol)
- getAccountBalance (requires address)
- getTokenMetadata (requires contractAddress)

Output JSON with:
1. "api": API method name
2. "params": Parameters object
3. "chain": Blockchain network (default: "ethereum/mainnet")

Query: {query}

Examples:
- "portfolio performance" → 
  {{"api": "getTokenTransfersByAccount", "params": {{"accountAddress": "0x..."}}}}
- "whales holding UNI" → 
  {{"api": "getTopTokenHolders", "params": {{"tokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}}}}
- "ETH price history" → 
  {{"api": "getPriceHistory", "params": {{"token": "ethereum"}}}}
"""

prompt = PromptTemplate(
    template=template,
    input_variables=["query"],
    validate_template=True
)

def parse_query(query: str) -> dict:
    try:
        result = (prompt | llm).invoke({"query": query})
        response_text = result.strip()
        
        # Clean JSON output
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        
        return json.loads(response_text)
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"error": "Could not parse query"}