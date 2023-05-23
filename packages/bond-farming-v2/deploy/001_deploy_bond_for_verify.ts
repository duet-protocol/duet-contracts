import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { useLogger } from '@private/shared/scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { advancedDeploy } from '@private/shared/scripts/deploy-utils'

export enum Names {
  SingleBondTemplate = 'SingleBondTemplate',
}

const gasLimit = 6000000

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await advancedDeploy(
    {
      hre,
      logger,
      proxied: false,
      name: Names.SingleBondTemplate,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        gasLimit: gasLimit,
        contract: 'SingleBond',
        // string memory name_,
        // string memory symbol_,
        // IERC20Metadata underlying_,
        // uint256 maturity_,
        // bool onlyOwnerMintable_
        args: ['dummy contract', 'dummy symbol', '0xe9e7cea3dedca5984780bafc599bd69add087d56', 1, true],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
}
export default func
