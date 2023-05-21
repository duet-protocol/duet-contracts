import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import config from '../config'
import { useLogger } from '@private/shared/scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from '@private/shared/scripts/deploy-utils'
import { parseEther } from 'ethers/lib/utils'

enum Names {
  MockDuet = 'MockDuet',
  DuetProStaking = 'DuetProStaking',
  MockBoosterOracle = 'MockBoosterOracle',
}

const gasLimit = 12000000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get, read, execute } = deployments

  const networkName = useNetworkName()
  if (networkName !== 'arbitrum') {
    throw new Error('This script is only for arbitrum')
  }
  const { deployer } = await getNamedAccounts()

  const mockDuet = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: Names.MockDuet,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'MockERC20',
        args: ['MockDuet', 'MockDUET', parseEther('100000'), 18],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )

  const mockOracle = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: Names.MockBoosterOracle,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'MockBoosterOracle',
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )

  const duetStaking = await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: Names.DuetProStaking,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        gasLimit: gasLimit,
        // gasPrice: parseEther('0.0000000001'),
        contract: 'DuetProStaking',
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              // IPool pool_,
              // IDeriLens deriLens_,
              // IERC20MetadataUpgradeable usdLikeUnderlying_,
              // IBoosterOracle boosterOracle_,
              // address admin_
              args: [
                config.address.DeriPool[networkName],
                config.address.DeriLens[networkName],
                USDC_ADDRESS,
                mockOracle.address,
                deployer,
              ],
            },
          },
        },
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
}
export default func
