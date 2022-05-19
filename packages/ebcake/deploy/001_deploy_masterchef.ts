import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils';

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();

  const masterChef = await deploy('MultiRewardsMasterChef', {
    from: deployer,
    proxy: true,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  logger.info('MultiRewardsMasterChef deployed, ', masterChef.address);
  if (masterChef.newlyDeployed) {
    await execute('MultiRewardsMasterChef', { from: deployer }, 'initialize', deployer);
  }
};
export default func;
