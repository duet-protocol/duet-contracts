require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')
require('hardhat-abi-exporter')
require('@typechain/hardhat')

const dotenv = require('dotenv')
dotenv.config()

const mnemonic = process.env.MNEMONIC
const infurakey = process.env.INFURA_API_KEY
const scankey = process.env.ETHERSCAN_API_KEY

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task('accounts', 'Prints the list of accounts', async () => {
//   const accounts = await ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.11',
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },

  abiExporter: {
    path: './deployments/abi',
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
    pretty: true,
  },

  networks: {
    dev: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },

    kovan_fork: {
      url: 'http://127.0.0.1:8545',
    },

    testbsc: {
      // https://data-seed-prebsc-1-s1.binance.org:8545/
      // https://data-seed-prebsc-1-s3.binance.org:8545/
      // https://data-seed-prebsc-2-s2.binance.org:8545/
      url: 'https://data-seed-prebsc-2-s2.binance.org:8545/',
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [process.env.KEY_BSC_TEST],
    },

    bsc: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: [process.env.KEY_BSC_MAINNET],
    },

    main: {
      url: `https://mainnet.infura.io/v3/${infurakey}`,
      accounts: {
        count: 1,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      chainId: 1,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${infurakey}`,
      accounts: {
        count: 1,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      chainId: 5,
    },
  },

  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: scankey,
  },
}
