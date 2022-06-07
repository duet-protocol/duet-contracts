/* eslint-disable node/no-unpublished-import,node/no-missing-import */

import { ethers, network } from 'hardhat';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import config from '../config';
import { MasterChefDeployNames } from './001_deploy_masterchef';
import { ZERO_ADDRESS } from '../test/helpers';
import { pancakeFactoryABI } from '../3rd/pancake';
import { Event } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import { useLogger } from '../scripts/utils';
import { resolve } from 'path';
import { mkdir, writeFile } from 'fs/promises';

export type NetworkName = 'bsc' | 'bsctest' | 'hardhat';

export function useNetworkName() {
  return network.name as NetworkName;
}

export const testId = 'GDM-0620';

export enum ContractTag {
  BOND_TOKEN = 'BOND_TOKEN',
  BOND_FARM = 'BOND_FARM',
  BOND_LP_FARM = 'BOND_LP_FARM',
  BOND = 'BOND',
}

export interface BondDeployNamesSpec {
  ExtendableBondToken: string;
  BondFarmingPool: string;
  ExtendableBondedCake: string;
  BondLPFarmingPool: string;
}

const logger = useLogger(__filename);

export async function latestBlockNumber() {
  return (await ethers.provider.getBlock('latest')).number;
}

export async function deployBond(input: {
  name: string;
  symbol: string;
  instancePrefix: string;
  hre: HardhatRuntimeEnvironment;
  deployNames: BondDeployNamesSpec;
  farm?: {
    singleAllocPoint?: number;
    lpAllocPoint?: number;
  };
  bondLPFarmingContract?: string;
  checkpoints: {
    convertable: boolean;
    convertableFrom: number;
    convertableEnd: number;
    redeemable: boolean;
    redeemableFrom: number;
    redeemableEnd: number;
    maturity: number;
  };
}) {
  const {
    name,
    symbol,
    instancePrefix,
    hre,
    deployNames,
    checkpoints,
    farm = {},
    bondLPFarmingContract = 'BondLPPancakeFarmingPool',
  } = input;
  const gasLimit = 3000000;

  const [deployerSigner] = await ethers.getSigners();
  const networkName = useNetworkName();
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, execute, read, get } = deployments;

  const { deployer } = await getNamedAccounts();

  const bondToken = await deploy(deployNames.ExtendableBondToken, {
    from: deployer,
    contract: 'BondToken',
    args: [name, symbol, deployer],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  await writeExtraMeta(deployNames.ExtendableBondToken, { class: 'BondToken', instance: instancePrefix + 'ExtendableBondToken' })

  const bond = await deploy(deployNames.ExtendableBondedCake, {
    from: deployer,
    contract: 'ExtendableBondedCake',
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args: [bondToken.address, config.address.CakeToken[networkName], deployer],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  await writeExtraMeta(deployNames.ExtendableBondedCake, { class: 'ExtendableBondedCake', instance: instancePrefix + 'ExtendableBondedCake' })

  if (bond.newlyDeployed && bond?.numDeployments === 1) {
    logger.info('initializing', deployNames.ExtendableBondedCake);
    await execute(
      deployNames.ExtendableBondedCake,
      { from: deployer, gasLimit },
      'setCakePool',
      config.address.CakePool[networkName],
    );
    await execute(deployNames.ExtendableBondedCake, { from: deployer, gasLimit }, 'updateCheckPoints', checkpoints);

    logger.info('initialized', deployNames.ExtendableBondedCake);
  }

  const bondFarmingPool = await deploy(deployNames.BondFarmingPool, {
    from: deployer,
    contract: 'BondFarmingPool',
    // IERC20 bondToken_,
    // IExtendableBond bond_
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args: [bondToken.address, bond.address, deployer],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  await writeExtraMeta(deployNames.BondFarmingPool, { class: 'BondFarmingPool', instance: instancePrefix + 'BondFarmingPool' })

  const bondLPFarmingPool = await deploy(deployNames.BondLPFarmingPool, {
    from: deployer,
    contract: bondLPFarmingContract,
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args: [bondToken.address, bond.address, deployer],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  await writeExtraMeta(deployNames.BondLPFarmingPool, { class: 'BondLPFarmingPool', instance: instancePrefix + 'BondLPFarmingPool' })

  if (bondLPFarmingPool.newlyDeployed && bondLPFarmingPool?.numDeployments === 1) {
    logger.info('initializing', deployNames.BondLPFarmingPool);

    const masterChefPoolLength = (
      await read(
        MasterChefDeployNames.MultiRewardsMasterChef,
        {
          from: deployer,
        },
        'poolLength',
      )
    ).toNumber();
    const masterChef = await get(MasterChefDeployNames.MultiRewardsMasterChef);
    logger.info('add pool for bondFarmingPool');
    await execute(
      MasterChefDeployNames.MultiRewardsMasterChef,
      {
        from: deployer,
        gasLimit,
      },
      'add',
      farm.singleAllocPoint ?? 0,
      ZERO_ADDRESS,
      bondFarmingPool.address,
      true,
    );
    logger.info('add pool for bondLPFarmingPool');
    await execute(
      MasterChefDeployNames.MultiRewardsMasterChef,
      {
        from: deployer,
        gasLimit,
      },
      'add',
      farm.lpAllocPoint ?? 0,
      ZERO_ADDRESS,
      bondLPFarmingPool.address,
      true,
    );
    logger.info('setMasterChef for BondFarmingPool');
    await execute(
      deployNames.BondFarmingPool,
      { from: deployer, gasLimit },
      'setMasterChef',
      masterChef.address,
      masterChefPoolLength,
    );
    logger.info('setMasterChef for BondLPFarmingPool');
    await execute(
      deployNames.BondLPFarmingPool,
      { from: deployer, gasLimit },
      'setMasterChef',
      masterChef.address,
      masterChefPoolLength + 1,
    );
    logger.info('setMinter for ExtendableBondToken');
    await execute(deployNames.ExtendableBondToken, { from: deployer }, 'setMinter', bond.address);
    logger.info('setSiblingPool for BondFarmingPool');
    await execute(
      deployNames.BondFarmingPool,
      { from: deployer, gasLimit },
      'setSiblingPool',
      bondLPFarmingPool.address,
    );
    logger.info('setSiblingPool for BondLPFarmingPool');
    await execute(
      deployNames.BondLPFarmingPool,
      { from: deployer, gasLimit },
      'setSiblingPool',
      bondFarmingPool.address,
    );
    logger.info('setFarmingPools for ExtendableBondedCake');
    await execute(
      deployNames.ExtendableBondedCake,
      { from: deployer, gasLimit },
      'setFarmingPools',
      bondFarmingPool.address,
      bondLPFarmingPool.address,
    );

    logger.info('create pancakeswap LP Token');
    // create pancakeswap LP Token
    const pancakeFactory = await ethers.getContractAt(pancakeFactoryABI, config.address.PancakeFactory[networkName]);
    const ret = await pancakeFactory
      .connect(deployerSigner)
      .createPair(bondToken.address, config.address.CakeToken[networkName]);
    const retReceipt = await ret.wait();
    logger.info('retReceipt', retReceipt);
    const lpTokenAddress = retReceipt.events.filter((e: Event) => e.event === 'PairCreated')[0].args.pair;
    if (!lpTokenAddress) {
      throw new Error('PancakeSwap pair token created failed');
    }
    logger.info('LPToken created', lpTokenAddress);
    logger.info('setLpToken for BondLPFarmingPool');
    await execute(deployNames.BondLPFarmingPool, { from: deployer, gasLimit }, 'setLpToken', lpTokenAddress);

    logger.info('initialized', deployNames.BondLPFarmingPool);
  }
}

export async function writeExtraMeta(name: string, meta?: { class?: string, instance?: string } | string) {
  const directory = resolve(__dirname, '..', 'deployments', useNetworkName(), '.extraMeta')
  await mkdir(directory, { recursive: true })

  const className = typeof meta === 'string' ? meta : meta?.class || name
  const instanceName = typeof meta === 'string' ? meta : meta?.instance || className
  await writeFile(resolve(directory, name + '.json'), JSON.stringify({ class: className, instance: instanceName }, null, 2))
}
