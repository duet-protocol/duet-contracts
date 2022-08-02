const { ethers, network } = require('hardhat');

/**
 *
 * @param {() => Promise<string[]>} getUnnamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getUnnamedAccounts, deployments }) => {
  const { deploy, execute, getNetworkName } = deployments;
  if (getNetworkName() !== 'forked') {
    console.error('must be forked network');
    return;
  }
  const [deployer] = await getUnnamedAccounts();
  const ret = await deploy('AppController_Implementation', {
    from: deployer,
    contract: 'AppController',
    skipIfAlreadyDeployed: true,
    args: [],
    log: true,
  });
  const execConfig = { from: deployer, gasLimit: 3000000 };
  // modify Admin of AppController
  // await network.provider.send('tenderly_setStorageAt', [
  //   '0x01d77e7cc19cc562adb17ad6cb1f08f7a66fe301',
  //   '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
  //   '0x00d7a6a2f161d3f4971a3d1b071ef55b284fd3bf',
  // ]);
  // await execute('AppController', { from: deployer, gasLimit: 3000000 }, 'upgradeTo', ret.address);
  // await network.provider.send('tenderly_setStorageAt', [
  //   '0x01d77e7cc19cc562adb17ad6cb1f08f7a66fe301',
  //   '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
  //   '0x19Da3adb9c3A901C4850B632B6E1CAb2Dae14ea0',
  // ]);
  // const depositVaults = [
  //   // USDT-BUSD
  //   '0xbcedb96c87a3FeB4B9314b1F73c7E5f426051a16',
  //   // USDC-BUSD
  //   '0x534c727EF1CD043132DF558EdB734Da4BE5b7E66',
  //   // USDC-USDT
  //   '0xc76944B36E928FDAf9F481048C770877BCe4cd25',
  //   // BNB-CAKE
  //   '0x51e6303fAB90554d4FCCF71d8BcF2246999c9313',
  //   // DUET-CAKE
  //   '0xecd30328108Fe62603705A56B5dF6757A2c9902E',
  //   // DUET-WBNB
  //   '0x3ff0b76A3db4356662Fdf808ede7C921de820A36',
  //   // CAKE
  //   '0x7d2Ae0355f374625EDA6E9CA2F3694bb880e39E1',
  //   // USDT
  //   '0xCAb51Fe16891960E1D0d8a3DCdb6c51C460536A7',
  //   // BUSD
  //   '0x90703ef182FE722Ea3A38a2f367aba72090aea0B',
  //   // sBUSD
  //   '0x1E3174C5757cf5457f8A3A8c3E4a35Ed2d138322',
  //   // USDC
  //   '0x7265f5C160142883855613Fb85C55900d7B5bD2e',
  //   // DUET
  //   '0x2b19468C5668c40DF22b9F2Bd335cbE6432970dE',
  //   // ETH
  //   '0x2197827b693eE46C3907893a6e9685BF36d66308',
  // ];
  // dusd
  // await execute(
  //   'AppController',
  //   { from: deployer, gasLimit: 3000000 },
  //   'setVaultStates',
  //   '0xcc8bBe47c0394AbbCA37fF0fb824eFDC79852377',
  //   {
  //     enabled: true,
  //     enableDeposit: false,
  //     enableWithdraw: false,
  //     enableBorrow: false,
  //     enableRepay: false,
  //     enableLiquidate: true,
  //   },
  // );
  // await execute(
  //   'FeeConf',
  //   execConfig,
  //   'setConfig',
  //   ethers.utils.formatBytes32String('liq_fee'),
  //   '0x19Da3adb9c3A901C4850B632B6E1CAb2Dae14ea0',
  //   0,
  // );
  await execute(
    'AppController',
    execConfig,
    'releaseMintVaults',
    '0x45aecad3551f5c628e07a2a2b190bce2229fde5a',
    '0xCb5177809b24DE33aFF7589809b1951fFa2269Fd',
    ['0xcc8bBe47c0394AbbCA37fF0fb824eFDC79852377'],
  );
  console.log('deployed AppController_Implementation: ', ret.address);
};
