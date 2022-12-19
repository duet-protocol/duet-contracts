import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { advancedDeploy, useNetworkName } from './.defines'
import config from '../config'

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy } = deployments
  const network = useNetworkName()
  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      name: 'DuetTransparentUpgradeableProxy',
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: name,
        // dummy contracts
        args: [config.address.dummyImplementation[network], config.address.dummyImplementation[network], '0x'],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
}
export default func
