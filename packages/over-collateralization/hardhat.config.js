require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')
require('hardhat-abi-exporter')
require('@typechain/hardhat')
require('hardhat-deploy')
const { task } = require('hardhat/config')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

require('dotenv').config()
const tenderly = require('@tenderly/hardhat-tenderly')
const { getEtherscanEndpoints } = require('@nomiclabs/hardhat-etherscan/dist/src/network/prober')
const { chainConfig } = require('@nomiclabs/hardhat-etherscan/dist/src/ChainConfig')
const { resolveEtherscanApiKey } = require('@nomiclabs/hardhat-etherscan/dist/src/resolveEtherscanApiKey')
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

    bsctest: {
      // https://data-seed-prebsc-1-s1.binance.org:8545/
      // https://data-seed-prebsc-1-s3.binance.org:8545/
      // https://data-seed-prebsc-2-s2.binance.org:8545/
      allowUnlimitedContractSize: true,
      url: 'https://data-seed-prebsc-2-s2.binance.org:8545/',
      chainId: 97,
      accounts: [process.env.KEY_BSC_TEST, process.env.KEY_PROXY_ADMIN_BSC_TEST],
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

task('verify-legacy', 'verify duet legacy contracts', async (taskArgs, hre) => {
  const contracts = [
    {
      file: 'DYTokenERC20.sol',
      name: 'DYTokenERC20',
      deployment: 'DYTokenERC20ForVerify.json',
    },
    {
      file: 'AppController.sol',
      name: 'AppController',
      deployment: 'AppController_Implementation.json',
    },
    {
      file: 'VaultFactory.sol',
      name: 'VaultFactory',
      deployment: 'VaultFactory_Implementation.json',
    },
    {
      file: 'vault/LpFarmingVault.sol',
      name: 'LpFarmingVault',
      deployment: 'LpFarmingVaultTemplate.json',
    },
    {
      file: 'vault/SingleFarmingVault.sol',
      name: 'SingleFarmingVault',
      deployment: 'SingleFarmingVaultTemplate.json',
    },
  ]
  const networkName = hre.network.name
  const deploymentPath = path.resolve(__dirname, 'deployments', networkName)
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Invalid network '${networkName}'`)
  }
  const etherscanEndpoints = await getEtherscanEndpoints(
    hre.network.provider,
    hre.network.name,
    chainConfig,
    hre.config.etherscan.customChains,
  )
  const etherscanApiKey = resolveEtherscanApiKey(hre.config.etherscan.apiKey, hre.network)

  for (const contract of contracts) {
    const deployment = require(path.resolve(deploymentPath, contract.deployment))
    const abiInfo = await axios.get(etherscanEndpoints.urls.apiURL, {
      params: {
        module: 'contract',
        action: 'getabi',
        address: deployment.address,
        apikey: etherscanApiKey,
      },
    })
    if (abiInfo.data.status === '1') {
      console.info(
        `${contract.deployment} already verified, skipped. see ${etherscanEndpoints.urls.browserURL}/address/${deployment.address}#code`,
      )
      continue
    }
    const argsFile = path.resolve(
      require('os').tmpdir(),
      `duet-hardhat-deploy-tmp-${contract.deployment}-${new Date().getTime()}.js`,
    )
    if (deployment.args) {
      fs.writeFileSync(argsFile, `module.exports = ${JSON.stringify(deployment.args)};`)
    }
    console.log(fs.readFileSync(argsFile).toString())
    try {
      await hre.run(`verify`, {
        contract: `contracts/${contract.file}:${contract.name}`,
        address: deployment.address,
        ...(deployment.args
          ? {
              constructorArgs: argsFile,
            }
          : {}),
      })
    } catch (e) {
      console.error(e)
    } finally {
      if (deployment.args) {
        fs.rmSync(argsFile)
      }
    }
  }
})
