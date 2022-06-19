require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@openzeppelin/hardhat-upgrades');
require('@typechain/hardhat');

const dotenv = require('dotenv');
dotenv.config({ path: './.env_product' });

const mnemonic = process.env.MNEMONIC;
const infurakey = process.env.INFURA_API_KEY;
const scankey = process.env.BSCSCAN_API_KEY;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },

  networks: {
    dev: {
      url: 'http://127.0.0.1:8545',
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
      accounts: {
        mnemonic: mnemonic,
      },
    },

    bsc: {
      url: 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: {
        mnemonic: mnemonic,
      },
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
};
