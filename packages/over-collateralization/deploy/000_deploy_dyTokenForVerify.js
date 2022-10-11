/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, get, getNetworkName } = deployments
  const { deployer } = await getNamedAccounts()
  const exeOptions = { gasLimit: 300000, from: deployer }

  await deploy('DYTokenERC20ForVerify', {
    from: deployer,
    contract: 'DYTokenERC20',
    // DYTokenERC20 dyToken = new DYTokenERC20(address(underlying_), underlying_.symbol(), address(this));
    args: [(await get('BUSD')).address, 'TEMPLATE', deployer],
    log: true,
  })
}
