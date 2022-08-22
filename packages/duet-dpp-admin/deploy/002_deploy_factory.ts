import { readFile } from 'fs/promises';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { resolve } from 'path';
import config, { getCtrlFactoryConfig } from '../config';
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils';
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy';
import { useNetworkName, advancedDeploy } from './defines';



const gasLimit = 3000000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const root = resolve(__dirname, '../../..')

const logger = useLogger(__filename);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment;
  const { deploy, get, read, execute } = deployments;

  const networkName = useNetworkName()

  const { address: dppCtrlTempAddress } = JSON.parse(`${await readFile(
    `${root}/packages/duet-dpp-admin/deployments/${networkName}/DppControllerTemp.json`
  )}`)
  const { address: dppAdminTempAddress } = JSON.parse(`${await readFile(
    `${root}/packages/duet-dpp-admin/deployments/${networkName}/DppAdminTemp.json`
  )}`)
  const { address: dppTempAddress } = JSON.parse(`${await readFile(
    `${root}/packages/duet-dpp-admin/deployments/${networkName}/DppTemp.json`
  )}`)
  const { address: cloneFactoryAddress } = JSON.parse(`${await readFile(
    `${root}/packages/duet-dpp-admin/deployments/${networkName}/CloneFactory.json`
  )}`)



  const { deployer } = await getNamedAccounts();

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

  const dodoConfig = getCtrlFactoryConfig(networkName)


  const factoryImplement = await advancedDeploy({
    hre,
    logger,
    proxied: false,
    name: 'DppCtrlFactory',
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: 'DuetDPPFactory',

      args: [
        deployer,
        cloneFactoryAddress,
        dppTempAddress,
        dppAdminTempAddress,
        dppCtrlTempAddress,
        dodoConfig.defaultMaintainer ? dodoConfig.defaultMaintainer : deployer,
        dodoConfig.defaultMtFeeRateModel,
        dodoConfig.dodoApproveProxy,
        dodoConfig.weth
      ],

      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })

};
export default func;