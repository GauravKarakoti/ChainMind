import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.NODIT_API_KEY || "";
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
	solidity: "0.8.0",
	networks: {
		nodit_ethereum_sepolia: {
			url: `https://ethereum-sepolia.nodit.io/${API_KEY}`,
			accounts: [PRIVATE_KEY],
		},
		nodit_base_sepolia: {
			url: `https://base-sepolia.nodit.io/${API_KEY}`,
			accounts: [PRIVATE_KEY],
		},
	},
};

export default config;