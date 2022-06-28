/* eslint-disable node/no-unpublished-import,node/no-missing-import */

import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { parseEther } from 'ethers/lib/utils';
import { advancedDeploy, useNetworkName, writeExtraMeta } from './.defines';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { MasterChefDeployNames } from './001_deploy_masterchef';
import { ethers } from 'hardhat';
import { useLogger } from '../scripts/utils';

export enum MockBduetDeployNames {
  mockBDUET = 'mockBDUET',
}

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['bsctest', 'hardhat'].includes(useNetworkName())) {
    return;
  }
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();
  const bDuetMintAmount = 1000000;

  const bDuet = await advancedDeploy({
    hre,
    logger,
    name: MockBduetDeployNames.mockBDUET,
    proxied: false,
    class: 'MockBEP20',
    instance: MockBduetDeployNames.mockBDUET,
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: 'MockBEP20',
      // string memory name,
      // string memory symbol,
      // uint256 supply
      args: [`mock bDUET 0603`, `bDUET-MOCK-0603`, parseEther(bDuetMintAmount.toString())],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
  })


  if (bDuet.newlyDeployed) {
    logger.info('reward spec adding...');
    const latestBlock = await ethers.provider.getBlock('latest');
    const bDuetPerBlock = 0.1;
    await execute(
      MockBduetDeployNames.mockBDUET,
      {
        from: deployer,
      },
      'approve',
      (
        await deployments.get(MasterChefDeployNames.MultiRewardsMasterChef)
      ).address,
      parseEther(bDuetMintAmount.toString()),
    );
    await execute(
      MasterChefDeployNames.MultiRewardsMasterChef,
      {
        from: deployer,
      },
      'addRewardSpec',
      // IERC20 token,
      // uint256 rewardPerBlock,
      // uint256 startedAtBlock,
      // uint256 endedAtBlock
      bDuet.address,
      parseEther(bDuetPerBlock.toString()),
      latestBlock.number,
      latestBlock.number + bDuetMintAmount / bDuetPerBlock,
    );

    logger.info('reward spec added');
  }

};
export default func;
