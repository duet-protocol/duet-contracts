import { DeployFunction } from 'hardhat-deploy/types';
import { useNetworkName } from './defines';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import moment from 'moment';
import config from '../config';
import { useLogger } from '../scripts/utils';

export enum DeployNames {
  testWeekly_ExtendableBondToken = 'testWeekly_ExtendableBondToken',
  testWeekly_ExtendableBondedCake = 'testWeekly_ExtendableBondedCake',
  testWeekly_BondFarmingPool = 'testWeekly_BondFarmingPool',
  testWeekly_BondLPFarmingPool = 'testWeekly_BondLPFarmingPool',
}

const logger = useLogger(__filename);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const networkName = useNetworkName();
  if (networkName === 'bsc') {
    console.log('deploying bsc network, ignored testWeekly_Bond');
    return;
  }
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();

  const bondToken = await deploy(DeployNames.testWeekly_ExtendableBondToken, {
    from: deployer,
    contract: 'BondToken',
    args: ['test weekly ebCAKE', 'ebCAKE-W', deployer],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const bond = await deploy(DeployNames.testWeekly_ExtendableBondedCake, {
    from: deployer,
    contract: 'ExtendableBondedCake',

    proxy: true,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  if (bond.newlyDeployed) {
    await execute(
      DeployNames.testWeekly_ExtendableBondedCake,
      { from: deployer },
      'initialize',
      bondToken.address,
      config.address.CakeToken[networkName],
      deployer,
    );
    await execute(
      DeployNames.testWeekly_ExtendableBondedCake,
      { from: deployer },
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
    await execute(DeployNames.testWeekly_ExtendableBondedCake, { from: deployer }, 'updateCheckPoints', {
      convertable: true,
      convertableFrom: startOfWeek.unix(),
      convertableEnd: startOfWeek.add(2, 'days').unix(),
      redeemable: false,
      redeemableFrom: startOfWeek.add(7, 'days').unix(),
      redeemableEnd: startOfWeek.endOf('week').unix(),
      maturity: startOfWeek.endOf('week').unix(),
    });
  }
  const bondFarmingPool = await deploy(DeployNames.testWeekly_BondFarmingPool, {
    from: deployer,
    contract: 'BondFarmingPool',
    // IERC20 bondToken_,
    // IExtendableBond bond_
    args: [bondToken.address, bond.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  const bondLPFarmingPool = await deploy(DeployNames.testWeekly_BondLPFarmingPool, {
    from: deployer,
    contract: 'BondLPFarmingPool',
    proxy: true,

    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  if (bondLPFarmingPool.newlyDeployed) {
    logger.info('history', bondLPFarmingPool.history);
    // IERC20 bondToken_, IExtendableBond bond_
    await execute(
      DeployNames.testWeekly_BondLPFarmingPool,
      { from: deployer },
      'initialize',
      bondToken.address,
      bond.address,
      deployer,
    );

    await execute(DeployNames.testWeekly_ExtendableBondToken, { from: deployer }, 'setMinter', bond.address);
    await execute(
      DeployNames.testWeekly_BondFarmingPool,
      { from: deployer },
      'setSiblingPool',
      bondLPFarmingPool.address,
    );
    await execute(
      DeployNames.testWeekly_BondLPFarmingPool,
      { from: deployer },
      'setSiblingPool',
      bondFarmingPool.address,
    );
    await execute(
      DeployNames.testWeekly_ExtendableBondedCake,
      { from: deployer },
      'setFarmingPools',
      bondFarmingPool.address,
      bondLPFarmingPool.address,
    );
  }

  // await execute();
  // manually todo list
  // 1. add LP Token on pancakeswap
  // 2. call testWeekly_BondLPFarmingPool.setLpToken()
  // 3. add bDUET reward to MasterChef
  // 4. set masterChef contract address and pid to testWeekly_BondFarmingPool and testWeekly_BondLPFarmingPool
};
export default func;
