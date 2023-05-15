import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import config from '../config'
import { useLogger } from '@private/shared/scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from '@private/shared/scripts/deploy-utils'
import { parseEther } from 'ethers/lib/utils'

enum Names {
  SingleBondFactory = 'SingleBondFactory',
}

const gasLimit = 6000000

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get, read, execute } = deployments

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: Names.SingleBondFactory,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        gasLimit: gasLimit,
        contract: 'SingleBondFactory',
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              args: ['0x95EE03e1e2C5c4877f9A298F1C0D6c98698FAB7B', 8],
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
