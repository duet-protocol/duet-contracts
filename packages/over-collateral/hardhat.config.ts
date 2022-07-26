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
import { useLogger } from './scripts/utils';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import * as ethers from 'ethers';
import { resolveEtherscanApiKey } from '@nomiclabs/hardhat-etherscan/dist/src/resolveEtherscanApiKey';
import { getEtherscanEndpoints } from '@nomiclabs/hardhat-etherscan/dist/src/network/prober';
import { chainConfig } from '@nomiclabs/hardhat-etherscan/dist/src/ChainConfig';
import _, { pick } from 'lodash';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { isAddress } from 'ethers/lib/utils';
import type { HardhatDeployRuntimeEnvironment } from './types/hardhat-deploy';
import conf from './config';
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

dotenv.config();

const logger = useLogger(__filename);
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
      chainId: 30097,
      ...(process.env.FORK_ENABLED === 'on'
        ? {
            chainId: process.env.FORK_CHAIN_ID ? parseInt(process.env.FORK_CHAIN_ID) : 30097,
            forking: {
              url: process.env.FORK_URL!,
              blockNumber: parseInt(process.env.FORK_BLOCK_NUMBER!),
            },
            accounts: [
              {
                privateKey: process.env.FORK_KEY!,
                balance: ethers.utils.parseEther('1000').toString(),
              },
            ],
          }
        : {}),
    },
    bsctest: {
      url: process.env.FORK_URL__BSCTEST || 'https://data-seed-prebsc-1-s3.binance.org:8545',
      chainId: 97,
      accounts: [process.env.KEY_BSC_TEST!],
      // for hardhat-eploy
      verify: {
        etherscan: {
          apiKey: process.env.BSCSCAN_TEST_KEY,
        },
      },
    },
    bsc: {
      url: process.env.FORK_URL__BSC || 'https://bsc-dataseed.binance.org/',
      chainId: 56,
      accounts: [process.env.KEY_BSC_MAINNET!],
      // for hardhat-eploy
      verify: {
        etherscan: {
          apiKey: process.env.BSCSCAN_KEY,
        },
      },
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
    // for hardhat-verify
    apiKey: {
      bsc: process.env.BSCSCAN_KEY!,
      bscTestnet: process.env.BSCSCAN_TEST_KEY!,
      mainnet: process.env.ETHERSCAN_API_KEY!,
    },
    customChains: [],
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => !['hardhat', 'local'].includes(hre.network.name)),
  },
};

export default config;




task('verify:duet', 'Verifies contract on Etherscan(Duet customized)', async (taskArgs, hre) => {
  const deploymentsPath = path.resolve(__dirname, 'deployments', hre.network.name);
  logger.info('deploymentsPath', deploymentsPath);
  const networkName = hre.network.name === 'bsctest' ? 'bscTestnet' : hre.network.name;
  const apiKey = resolveEtherscanApiKey(config.etherscan?.apiKey, networkName);
  const etherscanEndpoint = await getEtherscanEndpoints(
    hre.network.provider,
    networkName,
    chainConfig,
    config.etherscan?.customChains ?? [],
  );
  for (const deploymentFile of fs.readdirSync(deploymentsPath)) {
    if (deploymentFile.startsWith('.') || !deploymentFile.endsWith('.json')) {
      continue;
    }
    const deployment = require(path.resolve(deploymentsPath, deploymentFile));
    const address = deployment.address;
    if (!address) {
      logger.warn(`No address found in deployment file ${deploymentFile}`);
      continue;
    }
    const contract = Object.entries(JSON.parse(deployment.metadata).settings.compilationTarget)[0].join(':');

    logger.info('metadataString', contract);
    if (deployment?.userdoc?.notice === 'Proxy implementing EIP173 for ownership management') {
      logger.warn(
        `EIP173 Proxy found in deployment file ${deploymentFile} (${deployment.address}), skipped, it generated by hardhat-deploy, run "npx hardhat --network ${hre.network.name} etherscan-verify"`,
      );
      continue;
    }

    const ret = await axios.get(
      `${_.trim(etherscanEndpoint.urls.apiURL, '/')}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`,
    );

    if (ret.data.message === 'OK') {
      logger.info(`already verified: ${deploymentFile} - ${address}`);
      continue;
    }
    logger.info(`verifying ${deploymentFile} - ${address}`);
    const constructorArguments: string[] = deployment.args ?? [];
    try {
      await hre.run('verify:verify', {
        address,
        contract,
        constructorArguments,
      });
      logger.info(`verified ${deploymentFile} - ${address}`);
    } catch (e) {
      logger.error(`verify failed: ${deploymentFile} - ${address}`, e);
    }
  }
});



/**
 * Make sure it run after `deploy/001_for-accident-20220715` **SUCCEED** and **NOT** under BSC
 */
task('duet:accident-20220715:users', 'release user vault for accident 20220715')
  .setAction(async (_, hre) => {
    const root = path.resolve(__dirname, '../..')
    const pkg = path.resolve(__dirname)

    const { deployer } = await hre.getNamedAccounts()
    const signer = await hre.ethers.getSigner(deployer)

    const { address: liquidatorAddress } = JSON.parse(`${await readFile(
      `${root}/packages/d-assets-liquidator/deployments/${hre.network.name}/DuetNaiveLiquidator.json`
    )}`)

    const appCtrlContract = new hre.ethers.Contract(
      JSON.parse(`${await readFile(
        `${pkg}/legacy-deployments/${hre.network.name}/AppController.json`
      )}`).address,
      JSON.parse(`${await readFile(
        `${pkg}/deployments/${hre.network.name}/AppController_Implement.json`
      )}`).abi,
      signer,
    )

    const borrowVaults = (() => {
      if (hre.network.name === 'bsc') {
        return ['0xcc8bBe47c0394AbbCA37fF0fb824eFDC79852377']
      }
    })() || []


    const userEventsDirname = `${pkg}/deployments/${hre.network.name}/a0715`
    await mkdir(userEventsDirname, { recursive: true })
    const users = `${await readFile(`${userEventsDirname}/_users`)}`.split(/[\r\n]+/).map(x => x.trim()).filter(Boolean)

    const userEvents: Record<string, string[][]> = {}
    logger.info(`Will process ${users.length} users`)
    const { events } = await appCtrlContract.releaseVaults(users, borrowVaults, liquidatorAddress).then((tx: any) => tx.wait())
    for (const evt of events) {
      if (!evt.event) {
        logger.info(evt.data)
        continue
      }
      const { event, args: [u, ...args] } = evt
      logger.info(`[${event}]`, u, args)
      if (!userEvents[u]) userEvents[u] = []
      userEvents[u].push([event, ...[...args]])
    }
    await Promise.all(
      Object.entries(userEvents).map(async ([user, events]) => {
        await writeFile(`${userEventsDirname}/${user}.csv`, events.map((it) => it.join(',')).join('\n'))
      })
    )


  })



task('duet:accident-20220715:prepare')
  .setAction(async (_, hre) => {
    const pkg = path.resolve(__dirname)

    const { deployer } = await hre.getNamedAccounts()
    const signer = await hre.ethers.getSigner(deployer)
    const provider = signer.provider as any

    const { address: appCtrlAddress } = JSON.parse(`${await readFile(
      `${pkg}/legacy-deployments/${hre.network.name}/AppController.json`
    )}`)
    const { address: feeConfAddress } = JSON.parse(`${await readFile(
      `${pkg}/legacy-deployments/${hre.network.name}/FeeConf.json`
    )}`)


    const proxyAdminSlotKey = ethers.BigNumber.from(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('eip1967.proxy.admin'))).sub(1).toHexString()
    // const proxyAdminOwnerSlotKey = '0x0'
    const proxyAdminOwnerSlotKey = ethers.utils.hexZeroPad(ethers.utils.hexValue(0), 32)
    // const appCtrlOwnerSlotKey = '0x33'
    const appCtrlOwnerSlotKey = ethers.utils.hexZeroPad(ethers.utils.hexValue(51), 32)
    // const feeConfOwnerSlotKey = '0x0'
    const feeConfOwnerSlotKey = ethers.utils.hexZeroPad(ethers.utils.hexValue(0), 32)


    const proxyAdminAddress = await getStorageAddress(appCtrlAddress, proxyAdminSlotKey)
    await ensureStorageAddress(proxyAdminAddress, proxyAdminOwnerSlotKey, deployer)
    await ensureStorageAddress(appCtrlAddress, appCtrlOwnerSlotKey, deployer)
    await ensureStorageAddress(feeConfAddress, feeConfOwnerSlotKey, deployer)


    async function getStorageAddress(contractAddress: string, contractSlotKey: string) {
      const slotValue = await provider.getStorageAt(contractAddress, contractSlotKey)
      return ethers.utils.getAddress(`0x${slotValue.substring(26)}`)
    }

    async function ensureStorageAddress(contractAddress: string, contractSlotKey: string, expectedStorageAddress: string) {
      const check = async () => await getStorageAddress(contractAddress, contractSlotKey) === ethers.utils.getAddress(expectedStorageAddress)
      if (await check()) return
      const cmd = 'tenderly_setStorageAt'
      // const cmd = 'hardhat_setStorageAt'
      logger.info(`[${cmd}]`, contractAddress, contractSlotKey, expectedStorageAddress)
      await provider.send(cmd, [
        contractAddress,
        contractSlotKey,
        ethers.utils.defaultAbiCoder.encode(['address'], [ethers.utils.getAddress(expectedStorageAddress)]),
        // ethers.utils.hexZeroPad(
        //   ethers.utils.defaultAbiCoder.encode(['address'], [ethers.utils.getAddress(expectedStorageAddress)]),
        //   32,
        // )
      ])
      if (await check()) return
      throw new Error(`Can't override "${contractAddress}#${contractSlotKey}" as "${expectedStorageAddress}"`)
    }

  })

