require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545"
    },
    ...(PRIVATE_KEY && process.env.MONAD_TESTNET_RPC_URL
      ? {
          monadTestnet: {
            url: process.env.MONAD_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY]
          }
        }
      : {})
  }
};
