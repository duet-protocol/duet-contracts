const path = require('path')
const fs = require('fs')
/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, getNetworkName, execute, get } = deployments
  const { deployer, proxyAdmin } = await getNamedAccounts()
  console.log('proxyAdmin', await getNamedAccounts())
  const exeOptions = { gasLimit: 300000, from: proxyAdmin }
  const ret = await deploy('AppController_Implementation', {
    from: proxyAdmin,
    contract: 'AppController',
    args: [],
    log: true,
  })
  if (!ret.newlyDeployed) {
    return
  }
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
  await execute('AppController', exeOptions, 'upgradeTo', ret.address)

  console.log('Upgraded AppController to: ', ret.address)
}
// npx hardhat verify --contract contracts/AppController.sol:dWTI 0x587Fb3e1C6819fd54e3740C6C4C7832484eF451b --network bsc
