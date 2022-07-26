import { BigNumber } from 'ethers';
import { readFile } from 'fs/promises';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { resolve } from 'path';
import config from '../config';
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { useNetworkName, advancedDeploy, getProxyImplementAddress, getProxyAdminAddress } from './.defines';

const proxyAdminInfo = require('../vendors/oz-proxy-admin.json')
const { encodeTo32Bytes } = require('../vendors/encodeTo32Bytes')

const root = resolve(__dirname, '../../..')
const pkg = resolve(__dirname, '..')

enum Names {
  AppController = 'AppController',
  MockUSDOracle = 'MockUSDOracle',
  FeeConf = 'FeeConf',
}


const gasLimit = 3000000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';


  // 1. shutdown auto liquidator
  // 2. deploy <THIS>, including the warning logs for manual process
  // 3. load & store FeeConf[liq_fee]
  // 4. set FeeConf[repay_fee=0,liq_fee=0]
  // 5. ctrl.releaseVaults(users, [dUSD], liquidator, calldata)
  // 6. ctrl.setOracles(dUSD, newAddress, 0, 0)
  // 7. recover FeeConf[liq_fee]
  // 8. set back vaults states to original
  // 9. ctrl.setGlobalVaultState { enabled: true, enableDeposit: true, enableWithdraw: true, enableBorrow: true, enableRepay: true, enableLiquidate: true }
  // 10. turn auto-liquidator on

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, } = deployments;

  const networkName = useNetworkName()
  const usingMultisig = process.env.NO_MULTISIG ? false : networkName === 'bsc'
  const useProxyAdmin = !process.env.NO_PROXY_ADMIN

  const { deployer } = await getNamedAccounts();
  const signer = await hre.ethers.getSigner(deployer)


  const { address: appCtrlFacadeAddress } = JSON.parse(`${await readFile(
    `${pkg}/legacy-deployments/${hre.network.name}/${Names.AppController}.json`
  )}`)

  const prevImplementAddress = await getProxyImplementAddress(appCtrlFacadeAddress)

  const implementation = await deploy(`${Names.AppController}_Implement`, {
    from: deployer,
    contract: Names.AppController,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })


  onAppCtrlUpgrade:
  if (implementation.newlyDeployed || prevImplementAddress !== implementation.address) {
    if (!useProxyAdmin) break onAppCtrlUpgrade

    const proxyAdmin = await getProxyAdminAddress(appCtrlFacadeAddress)

    if (usingMultisig) {
      logger.warn(`For Multisig, please manually call "upgrade(${appCtrlFacadeAddress}, ${implementation.address}) under https://bscscan.com/address/${proxyAdmin}#writeContract"`)
      break onAppCtrlUpgrade
    }


    const AdminFactory = await hre.ethers.getContractFactory(proxyAdminInfo.abi, proxyAdminInfo.bytecode, signer)
    await AdminFactory.attach(proxyAdmin).upgrade(appCtrlFacadeAddress, implementation.address).then((tx: any) => tx.wait())

    // const ProxyFactory = await hre.ethers.getContractFactory(transparentProxyInfo.abi, transparentProxyInfo.bytecode, signer)
    // await ProxyFactory.attach(proxyAddress).upgradeTo(implementation.address).then((tx: any) => tx.wait())

    const newCurrentImplementationAddress = await getProxyImplementAddress(appCtrlFacadeAddress)
    if (prevImplementAddress === newCurrentImplementationAddress) throw new Error(`Manual upgrading failed: ${prevImplementAddress}`)
  }


  const appCtrlContract = new hre.ethers.Contract(appCtrlFacadeAddress, implementation.abi, signer)
  const feeConfContract = new hre.ethers.Contract(
    JSON.parse(`${await readFile(
      `${pkg}/legacy-deployments/${hre.network.name}/${Names.FeeConf}.json`
    )}`).address,
    [
      'function getConfig(bytes32) view returns(address,uint256)',
      'function setConfig(bytes32,address,uint16)',
    ],
    signer,
  )


  {
    const { address: newOracleAddress } = await deploy(`${Names.MockUSDOracle}_20220715`, {
      from: deployer,
      contract: Names.MockUSDOracle,
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
    const [originalOracleAddress] = await appCtrlContract.getValueConf(config.address.dUSD[networkName])
    if (newOracleAddress !== originalOracleAddress) {
      logger.info(`Should call "setOracles(${config.address.dUSD[networkName]}, ${newOracleAddress}, 10000, 10000) under https://bscscan.com/address/${appCtrlFacadeAddress}#writeContract"`)
      // await appCtrlContract.setOracles(config.address.dUSD[networkName], newOracleAddress, 10000, 10000).then((tx: any) => tx.wait())
    }
  }


  if (!usingMultisig) {
    const { address: liquidatorAddress } = JSON.parse(`${await readFile(
      `${root}/packages/d-assets-liquidator/deployments/${networkName}/DuetNaiveLiquidator.json`
    )}`)
    {
      const key = encodeTo32Bytes('liq_fee')
      const [receiver, rate] = await feeConfContract.getConfig(key)
      if (!BigNumber.from(rate).eq(0) || receiver !== liquidatorAddress) {
        await feeConfContract.setConfig(key, liquidatorAddress, 0).then((tx: any) => tx.wait())
      }
    }
    {
      logger.info(`Should call "setGlobalVaultState({ enabled: true, enableDeposit: true, enableWithdraw: true, enableBorrow: true, enableRepay: true, enableLiquidate: true }) under https://bscscan.com/address/${appCtrlFacadeAddress}#writeContract"`)
    }
  }


};
export default func;

