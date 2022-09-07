require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')
require('hardhat-abi-exporter')
require('@typechain/hardhat')
require('hardhat-deploy')

require('dotenv').config()
const tenderly = require('@tenderly/hardhat-tenderly')
tenderly.setup()
// const { setGlobalDispatcher, ProxyAgent } = require('undici')
// const proxyAgent = new ProxyAgent('http://127.0.0.1:7890')
// setGlobalDispatcher(proxyAgent)

const mnemonic = process.env.MNEMONIC
const infurakey = process.env.INFURA_API_KEY
const scankey = process.env.ETHERSCAN_API_KEY

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  // Named accounts for plugin `hardhat-deploy`
  namedAccounts: {
    deployer: 0,
    proxyAdmin: 1,
  },
  abiExporter: {
    path: './deployments/abi',
    clear: true,
    flat: true,
    only: [],
    except: ['ERC20Upgradeable'],
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
      accounts: [process.env.KEY_BSC_MAINNET, process.env.KEY_PROXY_ADMIN_BSC_MAINNET],
    },
    forked: {
      url: process.env.FORK_URL,
      chainId: 8001,
      accounts: [process.env.KEY_BSC_MAINNET, process.env.KEY_PROXY_ADMIN_BSC_MAINNET],
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

    polygon: {
      url: 'https://polygon-rpc.com',
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 137,
    },

    testpolygon: {
      url: 'https://rpc-mumbai.matic.today',
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 80001,
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
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infurakey}`,
    },
  },

  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: scankey,
  },
}
