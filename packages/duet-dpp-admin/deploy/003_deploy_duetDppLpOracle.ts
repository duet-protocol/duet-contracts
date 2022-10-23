import { readFile } from 'fs/promises'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { advancedDeploy, NetworkName } from './.defines'
import { DodoOracleNames } from './003_deploy_dodoOracle'
import config from '../config'

const logger = useLogger(__filename)

export enum DuetDppLpOracleNames {
  DuetDppLpOracle = 'DuetDppLpOracle',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get } = deployments

  const { deployer } = await getNamedAccounts()
  const networkName = hre.network.name as NetworkName
  await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: DuetDppLpOracleNames.DuetDppLpOracle,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'DuetDppLpOracle',
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              // address admin_, address usdLikeToken_, IDodoOracle dodoOracle_
              args: [deployer, config.address.usd[networkName], (await get(DodoOracleNames.DodoOracle)).address],
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
