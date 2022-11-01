import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { advancedDeploy } from './.defines'
import { exec } from 'child_process'
import { BondFactoryNames } from './002_deploy_bondFactory'

const logger = useLogger(__filename)

export enum BondImplementationNames {
  DiscountBond = 'DiscountBond',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, execute } = deployments

  const { deployer } = await getNamedAccounts()

  const execOptions = {
    from: deployer,
    gasLimit: 30000000,
  }
  const discountBond = await advancedDeploy(
    {
      hre,
      logger,
      name: BondImplementationNames.DiscountBond,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: name,
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
  if (discountBond.newlyDeployed) {
    await execute(
      BondFactoryNames.Factory,
      execOptions,
      'setBondImplementation',
      'Discount',
      discountBond.address,
      true,
    )
  }
}
export default func
