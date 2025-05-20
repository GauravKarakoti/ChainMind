# ChainMind   

## AI-Powered Blockchain Assistant  
ChainMind lets you interact with Ethereum, Aptos, and XRPL using natural language. Ask questions, get insights, and automate actions.  

## Features  
- 🗣️ Natural language queries about wallets, tokens, and NFTs.  
- 📊 Auto-generated dashboards for portfolio performance.  
- 🚨 Real-time alerts for whale transactions.  
- 🔗 Multi-chain support (Ethereum, Aptos, XRPL).  

## Setup  
1. **Clone Repo**  
```bash 
git clone https://github.com/yourusername/chainmind.git  
cd chainmind
```
2. Install Dependencies
```bash
npm install
```
3. Configure Nodit
```bash
cp .env.example .env
```
4. Run
```bash
npm run dev
```

## Usage
1. Ask a Question
Type in the chat:
`"What’s the current balance of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on Ethereum?"`

2. Set an Alert
Try:
`"Notify me when any wallet receives over 1000 APT in the next 24 hours."`

## Code Highlights
- MCP Integration: chainmind/ai/mcp-integration.ts
- Multi-Chain Data Fetch: chainmind/lib/nodit-api.js
- Webhook Alert System: chainmind/services/webhooks.js

## Demo Video
Watch here.
