/* eslint-disable node/no-unpublished-import,node/no-missing-import */
import { DeployFunction } from 'hardhat-deploy/types';
import { advancedDeploy, deployBond, useNetworkName } from './.defines';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import moment from 'moment';
import { useLogger } from '../scripts/utils';

export enum DeployNames {
  /* eslint-disable camelcase */
  testWeekly_ExtendableBondToken = 'testWeekly_ExtendableBondToken',
  testWeekly_ExtendableBondedCake = 'testWeekly_ExtendableBondedCake',
  testWeekly_BondFarmingPool = 'testWeekly_BondFarmingPool',
  testWeekly_BondLPFarmingPool = 'testWeekly_BondLPFarmingPool',
  /* eslint-enable camelcase */
}

const logger = useLogger(__filename);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const networkName = useNetworkName();
  if (networkName === 'bsc') {
    logger.info('deploying bsc network, ignored testWeekly_Bond');
    return;
  }

  const now = moment().tz('UTC');
  await deployBond({
    name: 'test weekly ebCAKE 0603',
    symbol: 'ebCAKE-W-0603',
    bondLPFarmingContract: 'BondLPFarmingPool',
    instancePrefix: 'Weekly_',
    checkpoints: {
      convertable: true,
      convertableFrom: now.unix(),
      convertableEnd: now.clone().endOf('week').unix(),
      redeemable: true,
      redeemableFrom: now.clone().add(2, 'week').startOf('week').add(1, 'second').unix(),
      redeemableEnd: now.clone().add(2, 'week').startOf('week').endOf('day').unix(),
      maturity: now.clone().add(2, 'week').startOf('week').unix(),
    },
    hre,
    deployNames: {
      ExtendableBondToken: DeployNames.testWeekly_ExtendableBondToken,
      ExtendableBondedCake: DeployNames.testWeekly_ExtendableBondedCake,
      BondFarmingPool: DeployNames.testWeekly_BondFarmingPool,
      BondLPFarmingPool: DeployNames.testWeekly_BondLPFarmingPool,
    },
  });
};
export default func;
