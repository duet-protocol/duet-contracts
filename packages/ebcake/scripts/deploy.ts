// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, network, run } from 'hardhat';

const currentNetwork = network.name as 'bsc' | 'bsctest';

async function main(): Promise<void> {}

async function deployBondToken() {
  const [owner] = await ethers.getSigners();
  const BondToken = await ethers.getContractFactory('BondToken');

  // const bondToken = await BondToken.connect(owner).deploy('ebCAKE on bsc test', 'ebCAKE-TEST', owner.address);

  // console.log('Deployed:', bondToken.address);
  // writeAddress('0x45714A7daEb0739298811d6Aa291AA5d3F77fC92', 'BondToken');
  await run('verify:verify', {
    address: '0x45714A7daEb0739298811d6Aa291AA5d3F77fC92',
    constructorArguments: ['ebCAKE on bsc test', 'ebCAKE-TEST', owner.address],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
