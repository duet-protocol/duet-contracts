import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { parseEther } from 'ethers/lib/utils';
import { useNetworkName } from './defines';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!['bsctest', 'local'].includes(useNetworkName())) {
    return;
  }
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('mockBDUET', {
    from: deployer,
    contract: 'MockBEP20',
    // string memory name,
    // string memory symbol,
    // uint256 supply
    args: ['mock bDUET', 'bDUET-MOCK', parseEther('100000')],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;