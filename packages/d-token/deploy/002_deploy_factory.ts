import { readFile } from 'fs/promises';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { resolve } from 'path';
import config from '../config';
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { useNetworkName, advancedDeploy } from './.defines';



const gasLimit = 3000000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const root = resolve(__dirname, '../../..')

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, get, read, execute } = deployments;

  const networkName = useNetworkName()

  const { address: appCtrlAddress } = JSON.parse(`${await readFile(
    `${root}/packages/over-collateralization/deployments/${networkName}/AppController.json`
  )}`)
  const { address: feeConfAddress } = JSON.parse(`${await readFile(
    `${root}/packages/over-collateralization/deployments/${networkName}/FeeConf.json`
  )}`)



  const { deployer } = await getNamedAccounts();


  const mintVaultImplement = await advancedDeploy({
    hre,
    logger,
    proxied: false,
    name: 'MintVault_Implement',
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: 'MintVault',
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })


  await advancedDeploy({
    hre,
    logger,
    proxied: true,
    name: 'DTokenSuiteFactory',
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: name,
      proxy: {
        execute: {
          init: {
            methodName: 'initialize',
            args: [
              deployer,
              appCtrlAddress,
              feeConfAddress,
              mintVaultImplement.address,
            ],
          },
        },
      },
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })

  if (mintVaultImplement.newlyDeployed) {
    await execute('DTokenSuiteFactory', { from: deployer }, 'setSharedVaultImplement', mintVaultImplement.address)
  }

};
export default func;
