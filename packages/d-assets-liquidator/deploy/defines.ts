/* eslint-disable node/no-unpublished-import,node/no-missing-import */

import { ethers, network } from 'hardhat';

export type NetworkName = 'bsc' | 'bsctest' | 'hardhat';

export function useNetworkName() {
  return network.name as NetworkName;
}

export async function latestBlockNumber() {
  return (await ethers.provider.getBlock('latest')).number;
}

// faking for hardhat-deploy
export default () => {};
