import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@graphprotocol/hardhat-graph";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY || "";
const alchemyKey = process.env.ALCHEMY_KEY;
const etherscanKey = process.env.ETHERSCAN_KEY;
const msAlchemyURL = process.env.MS_ALCHEMY_URL;
const msAlchemyGoerliURL = process.env.MS_ALCHEMY_GOERLI_URL;

const config = {
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    subgraph: "./subgraph",
  },
  subgraph: {
    name: "mondesingulier",
  },
  solidity: {
    version: "0.8.12",
    settings: {
      metadata: {
        bytecodeHash: "ipfs",
      },
      optimizer: {
        enabled: true,
        runs: 300,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: etherscanKey,
  },
  networks: {
    goerli: {
      chainId: 5,
      url: msAlchemyGoerliURL,
      //gasPrice: 300000000000,
      accounts: [privateKey],
    },
    localhost: {
      url: "http://0.0.0.0:8545",
    },
    // hardhat: {
    //   chainId: 31337,
    //   forking: {
    //     url: msAlchemyURL,
    //     //blocknumber: 16140107
    //   },
    // },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.coinMarketCap_API,
  },
};

export default config;
