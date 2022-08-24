const path = require('path')
const fs = require('fs')
/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, getNetworkName, execute } = deployments
  // if (getNetworkName() !== 'forked') {
  //   console.error('must be forked network');
  //   return;
  // }
  const { proxyAdmin } = await getNamedAccounts()
  const ret = await deploy('AppController_Implementation', {
    from: proxyAdmin,
    contract: 'AppController',
    skipIfAlreadyDeployed: true,
    args: [],
    log: true,
  })
  const deploymentPath = path.join(__dirname, '/../deployments/', getNetworkName())
  console.log('deploymentPath', deploymentPath)
  const proxyMeta = require(path.join(deploymentPath, 'AppController_Proxy.json'))
  const implMeta = require(path.join(deploymentPath, 'AppController_Implementation.json'))
  console.log('proxyMeta', proxyMeta)
  // shift() to remove constructor
  implMeta.abi.shift()
  proxyMeta.abi.push(...implMeta.abi)
  fs.writeFileSync(`${deploymentPath}/AppController.json`, JSON.stringify(proxyMeta, null, 2))
  console.log('deployed AppController_Implementation: ', ret.address)
  console.log('Upgrading AppController to: ', ret.address)
  await execute('AppController', { gasLimit: 300000, from: proxyAdmin }, 'upgradeTo', ret.address)
  console.log('Upgraded AppController to: ', ret.address)
}
