/* eslint-disable node/no-missing-import,node/no-unpublished-import */
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { useLogger } from '../scripts/utils';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import config from '../config';
import { useNetworkName } from './defines';

export enum MasterChefDeployNames {
  DuetNaiveLiquidator = 'DuetNaiveLiquidator',
}

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const liquidator = await deploy('DuetNaiveLiquidator', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args: [deployer, config.address.DuetAppController[useNetworkName()]],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  logger.info('DuetNaiveLiquidator deployed, ', liquidator.address);
};
export default func;
