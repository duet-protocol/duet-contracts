// eslint-disable node/no-extraneous-import
import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-abi-exporter';
import 'hardhat-contract-sizer';
import 'hardhat-watcher';
import 'solidity-docgen';
import 'hardhat-deploy';
import { removeConsoleLog } from 'hardhat-preprocessor';

dotenv.config();

// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 99999,
      },
    },
  },
  // Named accounts for plugin `hardhat-deploy`
  namedAccounts: {
    deployer: 0,
  },
  docgen: {
    pages: 'files',
    outputDir: './docs',
  },
  networks: {
    hardhat: {
      // for CakePool
      allowUnlimitedContractSize: true,
    },
    local: {
      url: 'http://localhost:8545',
    },
    bsctest: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      accounts: [process.env.KEY_BSC_TEST!],
      verify: {
        etherscan: {
          apiKey: process.env.BSCSCAN_TEST_KEY,
        },
      },
    },
    bsc: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: [process.env.KEY_BSC_MAINNET!],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  gasReporter: {
    enabled: Boolean(process.env.REPORT_GAS),
    currency: 'USD',
    token: 'BNB',
    gasPriceApi: 'https://api.bscscan.com/api?module=proxy&action=eth_gasPrice',
    coinmarketcap: process.env.COIN_MARKETCAP_API_KEY,
  },
  watcher: {
    compile: {
      tasks: ['compile'],
    },
    test: {
      tasks: ['test'],
    },
  },
  abiExporter: {
    path: './data/abi',
    clear: true,
    flat: false,
    // runOnCompile: true,
    pretty: true,
  },
  etherscan: {
    apiKey: {
      // bsc: '',
      bscTestnet: process.env.BSCSCAN_TEST_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => !['hardhat', 'local'].includes(hre.network.name)),
  },
};

export default config;
