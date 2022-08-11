/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute, getNetworkName } = deployments;
  // if (getNetworkName() !== 'forked') {
  //   console.error('must be forked network');
  //   return;
  // }
  const { deployer } = await getNamedAccounts();
  await deploy('ZeroUSDOracle', {
    from: deployer,
    contract: 'ZeroUSDOracle',
    skipIfAlreadyDeployed: true,
    args: [],
    log: true,
  });
};
