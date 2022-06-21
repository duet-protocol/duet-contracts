/* eslint-disable node/no-unpublished-import,node/no-missing-import */
import { DeployFunction } from 'hardhat-deploy/types';
import { deployBond } from './defines';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import moment from 'moment-timezone';
import { useLogger } from '../scripts/utils';

moment.updateLocale('en', {
  week: {
    dow: 1,
  },
});

export enum DeployNames {
  /* eslint-disable camelcase */
  ebCAKE_Rabbit_ExtendableBondToken = 'ebCAKE_Rabbit_ExtendableBondToken',
  ebCAKE_Rabbit_ExtendableBondedCake = 'ebCAKE_Rabbit_ExtendableBondedCake',
  ebCAKE_Rabbit_BondFarmingPool = 'ebCAKE_Rabbit_BondFarmingPool',
  ebCAKE_Rabbit_BondLPFarmingPool = 'ebCAKE_Rabbit_BondLPFarmingPool',
  /* eslint-enable camelcase */
}

const logger = useLogger(__filename);

export function genCheckpoints() {
  const convertableFrom = moment().tz('UTC');
  const convertableEnd = convertableFrom.clone().add('1', 'quarter').endOf('quarter');
  const maturity = convertableEnd.clone().add(1, 'year');
  const redeemableFrom = maturity.clone().add(1, 'second');
  return {
    convertableFrom,
    convertableEnd,
    maturity,
    redeemableFrom,
    redeemableEnd: redeemableFrom.clone().add('3', 'day').subtract(1, 'second'),
  };
}

logger.info('checkpoints', genCheckpoints());
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const checkpoints = genCheckpoints();
  await deployBond({
    name: 'ebCAKE Rabbit',
    symbol: 'ebCAKE-Rabbit',
    farm: {
      singleAllocPoint: 0,
      lpAllocPoint: 0,
    },
    checkpoints: {
      convertable: true,
      convertableFrom: checkpoints.convertableFrom.unix(),
      convertableEnd: checkpoints.convertableEnd.unix(),
      redeemable: true,
      redeemableFrom: checkpoints.redeemableFrom.unix(),
      redeemableEnd: checkpoints.redeemableEnd.unix(),
      maturity: checkpoints.maturity.unix(),
    },
    hre,
    deployNames: {
      ExtendableBondToken: DeployNames.ebCAKE_Rabbit_ExtendableBondToken,
      ExtendableBondedCake: DeployNames.ebCAKE_Rabbit_ExtendableBondedCake,
      BondFarmingPool: DeployNames.ebCAKE_Rabbit_BondFarmingPool,
      BondLPFarmingPool: DeployNames.ebCAKE_Rabbit_BondLPFarmingPool,
    },
  });
};
export default func;
