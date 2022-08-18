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

  if (networkName === 'bsc') return



  const { deployer } = await getNamedAccounts();


  const aggregator = await advancedDeploy({
    hre,
    logger,
    proxied: false,
    name: 'MockOracleUSDAggregator',
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: name,
      args: [deployer],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })


  const controller = await advancedDeploy({
    hre,
    logger,
    proxied: false,
    name: 'MockController',
  }, async ({ name }) => {

    return await deploy(name, {
      from: deployer,
      contract: name,
      args: [],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })
  })



  // {
  //   const { address: feeConfAddress } = JSON.parse(`${await readFile(
  //     `${root}/packages/over-collateralization/deployments/${networkName}/FeeConf.json`
  //   )}`)
  //   const token = await advancedDeploy({
  //     hre,
  //     logger,
  //     proxied: false,
  //     name: 'MockDToken_Token',
  //   }, async ({ name }) => {

  //     return await deploy(name, {
  //       from: deployer,
  //       contract: 'DToken',
  //       args: ['Duet Mock DToken', 'dMockT'],
  //       log: true,
  //       autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //     })
  //   })
  //   const vault = await advancedDeploy({
  //     hre,
  //     logger,
  //     proxied: false,
  //     name: 'MockDToken_Vault',
  //   }, async ({ name }) => {

  //     return await deploy(name, {
  //       from: deployer,
  //       contract: 'MintVault',
  //       log: true,
  //       autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //     })
  //   })
  //   const oracle = await advancedDeploy({
  //     hre,
  //     logger,
  //     proxied: false,
  //     name: 'MockDToken_Oracle',
  //   }, async ({ name }) => {

  //     return await deploy(name, {
  //       from: deployer,
  //       contract: 'DTokenUSDOracle',
  //       log: true,
  //       autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //     })
  //   })

    // if (vault.newlyDeployed) {
    //   await execute('MockDToken_Vault', { from: deployer }, 'initialize', controller.address, feeConfAddress, token.address)
    // }
    // if (token.newlyDeployed || aggregator.newlyDeployed) {
      // await execute('MockDToken_Oracle', { from: deployer }, 'setAggregator', token.address, aggregator.address)
    // }
    // if (vault.newlyDeployed) {
    //   await execute('MockDToken_Token', { from: deployer }, 'addMiner', vault.address)
    // }
    // if (token.newlyDeployed || vault.newlyDeployed) {
    //   await execute('MockController', { from: deployer }, 'setVault', token.address, vault.address, 2)
    // }
    // if (vault.newlyDeployed) {
    //   await execute('MockController', { from: deployer }, 'setVaultStates', vault.address, {
    //     enabled: true, enableDeposit: true, enableWithdraw: true, enableBorrow: true, enableRepay: true, enableLiquidate: true,
    //   })
    // }
    // if (token.newlyDeployed && oracle.newlyDeployed) {
      // await execute('MockController', { from: deployer }, 'setOracles', token.address, oracle.address, 10000, 10000)
    // }

  // }


};
export default func;

