import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import config from '../config';
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { useNetworkName, advancedDeploy } from './.defines';

enum Names {
  ExtendableBondRegistry = 'ExtendableBondRegistry',
  ExtendableBondedCakeReader = 'ExtendableBondedCakeReader',
}

const gasLimit = 3000000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, get, execute } = deployments;

  const networkName = useNetworkName()
  const { deployer } = await getNamedAccounts();



  const ebRegistry = await advancedDeploy({
    hre,
    logger,
    proxied: true,
    name: Names.ExtendableBondRegistry,
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: name,
      proxy: {
        execute: {
          init: {
            methodName: 'initialize',
            args: [deployer],
          },
        },
      },
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })


  await advancedDeploy({
    hre,
    logger,
    proxied: true,
    name: Names.ExtendableBondedCakeReader,
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: name,
      proxy: {
        execute: {
          init: {
            methodName: 'initialize',
            args: [
              ebRegistry.address,
              config.address.CakePool[networkName], config.address.CakeMasterChefV2[networkName],
              config.address.PancakeLpTokenPair__CAKE_BUSD[networkName],
              config.address.PancakeLpTokenPair__DUET_BUSD[networkName] || ZERO_ADDRESS,
              config.address.PancakeLpTokenPair__DUET_CAKE[networkName] || ZERO_ADDRESS,
            ],
          },
        },
      },
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })


};
export default func;
