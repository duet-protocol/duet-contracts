/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute, getNetworkName } = deployments
  const { deployer } = await getNamedAccounts()
  const exeOptions = { gasLimit: 300000, from: deployer }

  const singleFarmingVault = await deploy('SingleFarmingVaultTemplate', {
    from: deployer,
    contract: 'SingleFarmingVault',
    args: [],
    log: true,
  })

  if (singleFarmingVault.newlyDeployed) {
    await execute('VaultFactory', exeOptions, 'setVaultImplementation', 'Single', singleFarmingVault.address)
  }

  const lpFarmingVault = await deploy('LpFarmingVaultTemplate', {
    from: deployer,
    contract: 'LpFarmingVault',
    args: [],
    log: true,
  })

  if (lpFarmingVault.newlyDeployed) {
    await execute('VaultFactory', exeOptions, 'setVaultImplementation', 'PancakeLP', lpFarmingVault.address)
  }
}
