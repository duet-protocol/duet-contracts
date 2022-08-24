import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { advancedDeploy } from './.defines'

export enum MasterChefDeployNames {
  MultiRewardsMasterChef = 'MultiRewardsMasterChef',
}

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      name: MasterChefDeployNames.MultiRewardsMasterChef,
      proxied: true,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
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
    },
  )
}
export default func
