const ethers = require('ethers');
const TronWeb = require('tronweb');
const xrpl = require('xrpl');

// Initialize blockchain providers
const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const tronWeb = new TronWeb.TronWeb({
  fullHost: process.env.TRON_FULL_NODE,
  privateKey: process.env.TRON_PRIVATE_KEY
});
const xrplClient = new xrpl.Client(process.env.XRPL_NODE);

// Contract ABIs for known protocols
const CONTRACT_ABIS = {
  ETHEREUM: {
    LIDO: [
      "function submit(address _referral) payable returns (uint256)"
    ]
  },
  TRON: {
    LIQUIDSWAP: [
      "function swapExactCoinForCoin(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)"
    ]
  }
};

async function executeEthContract(contractAddress, functionName, params, value, userAddress) {
  try {
    // Get contract ABI (use known ABI if available, otherwise try to fetch)
    const abi = CONTRACT_ABIS.ETHEREUM[contractAddress] || 
      await fetchABIFromEtherscan(contractAddress);
    
    const contract = new ethers.Contract(contractAddress, abi, ethProvider);
    const signer = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, ethProvider);
    const contractWithSigner = contract.connect(signer);

    let tx;
    
    // Handle specific protocols
    switch(functionName) {
      case 'submit': // Lido staking
        tx = await contractWithSigner.submit(userAddress, {
          value: ethers.parseEther(value.toString())
        });
        return { txHash: tx.hash };
      
      default:
        // Generic contract call
        tx = await contractWithSigner[functionName](...params, {
          value: ethers.parseEther(value?.toString() || '0')
        });
        return { txHash: tx.hash };
    }
  } catch (error) {
    console.error('ETH Contract Execution Error:', error);
    throw new Error(`Ethereum contract execution failed: ${error.message}`);
  }
}

async function executeTronContract(contractAddress, functionName, params, userAddress) {
  try {
    await tronWeb.setAddress(contractAddress);
    const contract = await tronWeb.contract().at(contractAddress);
    let result;
    
    switch(functionName) {
      case 'swapExactCoinForCoin': // LiquidSwap
        result = await contract
          .swapExactCoinForCoin(
            params[0], 
            params[1], 
            params[2], 
            userAddress, 
            Math.floor(Date.now() / 1000) + 300
          )
          .send({
            feeLimit: 100000000,
            callValue: params[0]
          });
        return { txHash: result };

      default:
        // Generic contract call
        result = await contract[functionName](...params).send();
        return { txHash: result };
    }
  } catch (error) {
    console.error('TRON Contract Execution Error:', error);
    throw new Error(`Tron contract execution failed: ${error.message}`);
  }
}

async function executeXrplContract(contractAddress, functionName, params, userAddress) {
  try {
    await xrplClient.connect();
    
    // Prepare transaction
    let transaction;
    switch(functionName) {
      case 'AMMDeposit':
        transaction = {
          TransactionType: 'AMMDeposit',
          Account: userAddress,
          Asset: {
            currency: params[0],
            issuer: params[1]
          },
          Asset2: {
            currency: params[2],
            issuer: params[3]
          },
          Amount: params[4].toString(),
          Flags: xrpl.AMMDepositFlags.tfLPToken
        };
        break;
      
      default:
        throw new Error(`Unsupported XRPL function: ${functionName}`);
    }
    
    // Sign and submit
    const prepared = await xrplClient.autofill(transaction);
    const signed = xrplClient.wallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);
    
    return { 
      txHash: result.result.hash,
      result: result.result.meta.TransactionResult
    };
  } catch (error) {
    console.error('XRPL Contract Execution Error:', error);
    throw new Error(`XRPL contract execution failed: ${error.message}`);
  } finally {
    xrplClient.disconnect();
  }
}

// Helper to fetch ABI from Etherscan
async function fetchABIFromEtherscan(contractAddress) {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`
    );
    
    if (response.data.status === '1') {
      return JSON.parse(response.data.result);
    }
    throw new Error('ABI not found on Etherscan');
  } catch (error) {
    console.error('ABI Fetch Error:', error);
    throw new Error(`Could not fetch ABI for contract: ${contractAddress}`);
  }
}

module.exports = {
    executeEthContract,
    executeTronContract,
    executeXrplContract
}