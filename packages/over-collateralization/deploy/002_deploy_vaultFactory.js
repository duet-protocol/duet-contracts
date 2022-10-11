/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute, get, getNetworkName } = deployments
  // if (getNetworkName() !== 'forked') {
  //   console.error('must be forked network');
  //   return;
  // }
  const { deployer, proxyAdmin } = await getNamedAccounts()
  const exeOptions = { gasLimit: 300000, from: deployer }

  const controller = await get('AppController')
  const feeConf = await get('FeeConf')
  const factory = await deploy('VaultFactory', {
    from: deployer,
    contract: 'VaultFactory',
    proxy: {
      execute: {
        init: {
          methodName: 'initialize',
          args: [controller.address, feeConf.address, deployer, proxyAdmin],
        },
      },
    },
    args: [],
    log: true,
  })

  if (factory.newlyDeployed) {
    execute('AppController', { gasLimit: 3000000, from: deployer }, 'setVaultFactory', factory.address)
  }
}
