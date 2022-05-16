import { DeployFunction } from 'hardhat-deploy/types';
import { useNetworkName } from './defines';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import config from '../config';

export enum DeployNames {
  testWeeklyExtendableBondToken = 'testWeeklyExtendableBondToken',
  testWeeklyExtendableBond = 'testWeeklyExtendableBond',
  testWeeklyBondFarmingPool = 'testWeeklyBondFarmingPool',
  testWeeklyBondLPFarmingPool = 'testWeeklyBondLPFarmingPool',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const networkName = useNetworkName();
  if (networkName === 'bsc') {
    console.log('deploying bsc network, ignored testWeeklyBond');
    return;
  }
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();

  const bondToken = await deploy(DeployNames.testWeeklyExtendableBondToken, {
    from: deployer,
    contract: 'BondToken',
    args: ['test weekly ebCAKE', 'ebCAKE-W', deployer],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const bond = await deploy('testWeeklyExtendableBond', {
    from: deployer,
    contract: 'ExtendableBond',

    proxy: {
      // BondToken bondToken_,
      // IERC20Upgradeable underlyingToken_,
      // ICakePool cakePool_,
      // address admin_
      proxyArgs: [
        bondToken.address,
        config.address.CakeToken[networkName],
        config.address.CakePool[networkName],
        deployer,
      ],
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const bondFarmingPool = await deploy(DeployNames.testWeeklyBondFarmingPool, {
    from: deployer,
    contract: 'BondFarmingPool',
    // IERC20 bondToken_,
    // IExtendableBond bond_
    args: [bondToken.address, bond.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  const bondLPFarmingPool = await deploy(DeployNames.testWeeklyBondLPFarmingPool, {
    from: deployer,
    contract: 'BondLPFarmingPool',
    // IERC20 bondToken_, IExtendableBond bond_
    args: [bondToken.address, bond.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await execute(DeployNames.testWeeklyExtendableBondToken, { from: deployer }, 'setMinter', bond.address);
  await execute(DeployNames.testWeeklyBondFarmingPool, { from: deployer }, 'setSiblingPool', bondLPFarmingPool.address);
  await execute(DeployNames.testWeeklyBondLPFarmingPool, { from: deployer }, 'setSiblingPool', bondFarmingPool.address);
  await execute(
    DeployNames.testWeeklyExtendableBond,
    { from: deployer },
    'setFarmingPools',
    bondFarmingPool.address,
    bondLPFarmingPool.address,
  );

  // await execute();
  // manually todo list
  // 1. add LP Token on pancakeswap
  // 2. call testWeeklyBondLPFarmingPool.setLpToken()
  // 3. add bDUET reward to MasterChef
  // 4. set masterChef contract address and pid to testWeeklyBondFarmingPool and testWeeklyBondLPFarmingPool
};
export default func;
