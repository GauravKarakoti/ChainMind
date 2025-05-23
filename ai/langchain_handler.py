from langchain.prompts import PromptTemplate
from langchain_openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

llm = OpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),  # Explicit parameter name
    temperature=0.7,
    model_name="gpt-3.5-turbo"
)

template = """
You are a blockchain data assistant. Map the user's query to a Nodit API call.

Query: {query}
Examples:
- "portfolio performance" → getTokenTransfersByAccount + CoinGecko price API
- "whales" → getTopTokenHolders
- "price history" → getPriceHistory
"""

prompt = PromptTemplate(
    template=template,
    input_variables=["query"],
    validate_template=True
)

def parse_query(query: str) -> str | None:
    try:
        result = (prompt | llm).invoke({"query": query})
        response_text = result.get("text", "")
        return response_text.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        return None

def resolve_ambiguous_query(query):
    if "vitalik" in query.lower():
        return {
            "api": "getAccountBalance",
            "params": { 
                "address": "0xeB4F0Cb1644FA1f6dd01Aa2F7c49099d2267F3A8",
                "chain": "ethereum"
            }
        }
    return {"error": "Could not resolve query"}

parse_query("Hello")
resolve_ambiguous_query("Hello")