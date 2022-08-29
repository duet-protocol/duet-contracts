import { readFile } from 'fs/promises'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { resolve } from 'path'
import config from '../config'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from './.defines'

const gasLimit = 3000000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const root = resolve(__dirname, '../../..')

const logger = useLogger(__filename)

export enum MockNames {
  MockOracle = 'MockOracle',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy } = deployments

  const networkName = useNetworkName()
  if (!['bsctest', 'hardhat'].includes(networkName)) {
    logger.warn(`bsctest and hardhat network only, ignored.`)
    return
  }

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: MockNames.MockOracle,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'MockOracle',
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              /*
               address admin_,
               */
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
