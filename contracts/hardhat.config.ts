import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";
import path from "path";

// Use the solc-js compiler from npm instead of downloading one from binaries.soliditylang.org
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: { solcVersion: string }, _hre, runSuper) => {
  if (args.solcVersion === "0.8.24") {
    return {
      compilerPath: path.join(__dirname, "node_modules", "solc", "soljson.js"),
      isSolcJs: true,
      version: args.solcVersion,
      longVersion: require("solc/package.json").version,
    };
  }
  return runSuper();
});

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    // Local node can mimic another chain id for end-to-end tests with the web app
    hardhat: { chainId: Number(process.env.HARDHAT_CHAIN_ID || 31337) },
    baseSepolia: { url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org", accounts },
    base: { url: process.env.BASE_RPC_URL || "https://mainnet.base.org", accounts },
  },
};

export default config;
