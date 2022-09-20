import { readFile } from 'fs/promises'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { resolve } from 'path'
import config from '../config'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from './.defines'
import { FactoryNames } from './002_deploy_factory'

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
  const { deploy, getOrNull, execute } = deployments

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
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

  const dppFactoryInfo = await getOrNull(FactoryNames.DuetDPPFactory)
  const dppTemplate = await advancedDeploy(
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
  const exeOptions = {
    gasLimit: 3000000,
    from: deployer,
  }
  if (dppTemplate.newlyDeployed && dppFactoryInfo) {
    logger.info('executing updateDppTemplate...')
    await execute(FactoryNames.DuetDPPFactory, exeOptions, 'updateDppTemplate', dppTemplate.address)
  }
  const dppAdminTemp = await advancedDeploy(
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
  if (dppAdminTemp.newlyDeployed && dppFactoryInfo) {
    logger.info('executing updateAdminTemplate...')
    await execute(FactoryNames.DuetDPPFactory, exeOptions, 'updateAdminTemplate', dppAdminTemp.address)
  }
  const dppControllerTemp = await advancedDeploy(
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

  if (dppControllerTemp.newlyDeployed && dppFactoryInfo) {
    logger.info('executing updateControllerTemplate...')
    await execute(FactoryNames.DuetDPPFactory, exeOptions, 'updateControllerTemplate', dppControllerTemp.address)
  }
}
export default func
