const { ethers } = require("hardhat");
const { saveContractAddress } = require("../utils/contract");
require('dotenv').config();

async function main() {
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MultiSigWallet contract
  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  
  // Configure owners and required confirmations
  const owners = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account 0
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",  // Hardhat account 2
    "0xeB4F0Cb1644FA1f6dd01Aa2F7c49099d2267F3A8"
  ];
  const required = 2; // Number of required confirmations

  const multiSig = await MultiSigWallet.deploy(owners, required);
  await multiSig.waitForDeployment();

  console.log("MultiSigWallet deployed to:", multiSig.target);
  
  // Save contract address to database
  await saveContractAddress("MultiSigWallet", multiSig.target, "ethereum/mainnet");
  
  return multiSig.target;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });