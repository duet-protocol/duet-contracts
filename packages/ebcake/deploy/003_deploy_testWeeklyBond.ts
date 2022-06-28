/* eslint-disable node/no-unpublished-import,node/no-missing-import */
import { DeployFunction } from 'hardhat-deploy/types';
import { advancedDeploy, useNetworkName } from './.defines';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import moment from 'moment';
import config from '../config';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { MasterChefDeployNames } from './001_deploy_masterchef';
import { ZERO_ADDRESS } from '../test/helpers';
import { ethers } from 'hardhat';
import { pancakeFactoryABI } from '../3rd/pancake';
import { useLogger } from '../scripts/utils';
import { Event } from 'ethers';

export enum DeployNames {
  /* eslint-disable camelcase */
  testWeekly_ExtendableBondToken = 'testWeekly_ExtendableBondToken',
  testWeekly_ExtendableBondedCake = 'testWeekly_ExtendableBondedCake',
  testWeekly_BondFarmingPool = 'testWeekly_BondFarmingPool',
  testWeekly_BondLPFarmingPool = 'testWeekly_BondLPFarmingPool',
  /* eslint-enable camelcase */
}

const logger = useLogger(__filename);
const gasLimit = 3000000;
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployerSigner] = await ethers.getSigners();
  const networkName = useNetworkName();
  if (networkName === 'bsc') {
    logger.info('deploying bsc network, ignored testWeekly_Bond');
    return;
  }
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, execute, read, get } = deployments;

  const { deployer } = await getNamedAccounts();


  const bondToken = await advancedDeploy({
    hre,
    logger,
    name: DeployNames.testWeekly_ExtendableBondToken,
    class: 'BondToken',
    instance: 'Weekly_ExtendableBondToken'
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: 'BondToken',
      args: [`test weekly ebCAKE 0603`, `ebCAKE-W-0603`, deployer],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })



  const bond = await advancedDeploy({
    hre,
    logger,
    name: DeployNames.testWeekly_ExtendableBondedCake,
    class: 'ExtendableBondedCake',
    instance: 'Weekly_ExtendableBondedCake'
  }, async ({ name }) => {

    return await deploy(name, {
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
    })
  })




  if (bond.newlyDeployed && bond?.numDeployments === 1) {
    logger.info('initializing', DeployNames.testWeekly_ExtendableBondedCake);
    await execute(
      DeployNames.testWeekly_ExtendableBondedCake,
      { from: deployer, gasLimit },
      'setCakePool',
      config.address.CakePool[networkName],
    );

    // function updateCheckPoints(CheckPoints calldata checkPoints_) public onlyAdminOrKeeper {
    //         bool convertable;
    //         uint256 convertableFrom;
    //         uint256 convertableEnd;
    //         bool redeemable;
    //         uint256 redeemableFrom;
    //         uint256 redeemableEnd;
    //         uint256 maturity;
    const startOfWeek = moment().utc().startOf('week');
    await execute(DeployNames.testWeekly_ExtendableBondedCake, { from: deployer, gasLimit }, 'updateCheckPoints', {
      convertable: true,
      convertableFrom: startOfWeek.unix(),
      convertableEnd: startOfWeek.clone().add(1, 'week').startOf('week').unix(),
      redeemable: false,
      redeemableFrom: startOfWeek.clone().add(1, 'week').endOf('week').subtract('1', 'day').startOf('day').unix(),
      redeemableEnd: startOfWeek.clone().add(1, 'week').endOf('week').unix(),
      maturity: startOfWeek.clone().add(1, 'week').endOf('week').subtract('1', 'day').startOf('day').unix(),
    });

    logger.info('initialized', DeployNames.testWeekly_ExtendableBondedCake);
  }



  const bondFarmingPool = await advancedDeploy({
    hre,
    logger,
    name: DeployNames.testWeekly_BondFarmingPool,
    class: 'BondFarmingPool',
    instance: 'Weekly_BondFarmingPool'
  }, async ({ name }) => {

    return await deploy(name, {
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
    })
  })




  const bondLPFarmingPool = await advancedDeploy({
    hre,
    logger,
    name: DeployNames.testWeekly_BondFarmingPool,
    class: 'BondLPFarmingPool',
    instance: 'Weekly_BondLPFarmingPool'
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: 'BondLPFarmingPool',
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
    })
  })



  if (bondLPFarmingPool.newlyDeployed && bondLPFarmingPool?.numDeployments === 1) {
    logger.info('initializing', DeployNames.testWeekly_BondLPFarmingPool);

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
    await execute(
      MasterChefDeployNames.MultiRewardsMasterChef,
      {
        from: deployer,
        gasLimit,
      },
      'add',
      10,
      ZERO_ADDRESS,
      bondFarmingPool.address,
      true,
    );
    await execute(
      MasterChefDeployNames.MultiRewardsMasterChef,
      {
        from: deployer,
        gasLimit,
      },
      'add',
      10,
      ZERO_ADDRESS,
      bondLPFarmingPool.address,
      true,
    );
    await execute(
      DeployNames.testWeekly_BondFarmingPool,
      { from: deployer, gasLimit },
      'setMasterChef',
      masterChef.address,
      masterChefPoolLength,
    );
    await execute(
      DeployNames.testWeekly_BondLPFarmingPool,
      { from: deployer, gasLimit },
      'setMasterChef',
      masterChef.address,
      masterChefPoolLength + 1,
    );
    await execute(DeployNames.testWeekly_ExtendableBondToken, { from: deployer }, 'setMinter', bond.address);
    await execute(
      DeployNames.testWeekly_BondFarmingPool,
      { from: deployer, gasLimit },
      'setSiblingPool',
      bondLPFarmingPool.address,
    );
    await execute(
      DeployNames.testWeekly_BondLPFarmingPool,
      { from: deployer, gasLimit },
      'setSiblingPool',
      bondFarmingPool.address,
    );
    const receipt = await execute(
      DeployNames.testWeekly_ExtendableBondedCake,
      { from: deployer, gasLimit },
      'setFarmingPools',
      bondFarmingPool.address,
      bondLPFarmingPool.address,
    );

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
    await execute(DeployNames.testWeekly_BondLPFarmingPool, { from: deployer, gasLimit }, 'setLpToken', lpTokenAddress);

    logger.info('initialized', DeployNames.testWeekly_BondLPFarmingPool);
  }
};
export default func;
