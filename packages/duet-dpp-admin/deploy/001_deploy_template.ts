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

export enum TemplateNames {
  CloneFactory = 'CloneFactory',
  DPPOracleTemplate = 'DPPOracleTemplate',
  DPPOracleAdminTemplate = 'DPPOracleAdminTemplate',
  DuetDppControllerTemplate = 'DuetDppControllerTemplate',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get, read, execute } = deployments

  const networkName = useNetworkName()

  if (networkName === 'bsc') return

  const { deployer } = await getNamedAccounts()

  const cloneFactory = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: TemplateNames.CloneFactory,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: name,
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )

  const DppTemplate = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: TemplateNames.DPPOracleTemplate,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'DPPOracle',
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )

  const DppAdminTemp = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: TemplateNames.DPPOracleAdminTemplate,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'DPPOracleAdmin',
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )

  const DppControllerTemp = await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: TemplateNames.DuetDppControllerTemplate,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'DuetDppController',
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
}
export default func
