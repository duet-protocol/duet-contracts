import { readFile } from 'fs/promises'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { resolve } from 'path'
import config from '../config'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from './.defines'
import { TemplateNames } from './001_deploy_template'

const gasLimit = 3000000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const root = resolve(__dirname, '../../..')

const logger = useLogger(__filename)

export enum FactoryNames {
  DuetDPPFactory = 'DuetDPPFactory',
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get, read, execute } = deployments

  const networkName = useNetworkName()

  const { address: dppCtrlTempAddress } = await get(TemplateNames.DuetDppControllerTemplate)
  const { address: dppAdminTempAddress } = await get(TemplateNames.DPPOracleAdminTemplate)
  const { address: dppTempAddress } = await get(TemplateNames.DPPOracleTemplate)
  const { address: cloneFactoryAddress } = await get(TemplateNames.CloneFactory)

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: FactoryNames.DuetDPPFactory,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: 'DuetDPPFactory',
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              /*
               address owner_,
               address cloneFactory_,
               address dppTemplate_,
               address dppAdminTemplate_,
               address dppControllerTemplate_,
               address defaultMaintainer_,
               address defaultMtFeeRateModel_,
               address dodoApproveProxy_,
               address weth_
               */
              args: [
                deployer,
                cloneFactoryAddress,
                dppTempAddress,
                dppAdminTempAddress,
                dppCtrlTempAddress,
                deployer,
                config.address.defaultMtFeeRateModel[networkName],
                config.address.dodoApproveProxy[networkName],
                config.address.weth[networkName],
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
