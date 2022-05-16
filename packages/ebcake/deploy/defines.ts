import { network } from 'hardhat';

export type NetworkName = 'bsc' | 'bsctest' | 'local';

export function useNetworkName() {
  return network.name as NetworkName;
}

export enum ContractTag {
  BOND_TOKEN = 'BOND_TOKEN',
  BOND_FARM = 'BOND_FARM',
  BOND_LP_FARM = 'BOND_LP_FARM',
  BOND = 'BOND',
}

// faking for hardhat-deploy
export default () => {};
