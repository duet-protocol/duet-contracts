/* eslint-disable node/no-unpublished-import,node/no-missing-import */
import { DeployFunction } from 'hardhat-deploy/types'
import { deployBond, useNetworkName } from './.defines'
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime'
import moment from 'moment-timezone'
import { useLogger } from '../scripts/utils'

moment.updateLocale('en', {
  week: {
    dow: 1,
  },
})

export enum DeployNames {
  /* eslint-disable camelcase */
  betaWeekly_ExtendableBondToken = 'betaWeekly_ExtendableBondToken',
  betaWeekly_ExtendableBondedCake = 'betaWeekly_ExtendableBondedCake',
  betaWeekly_BondFarmingPool = 'betaWeekly_BondFarmingPool',
  betaWeekly_BondLPFarmingPool = 'betaWeekly_BondLPFarmingPool',
  /* eslint-enable camelcase */
}

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (useNetworkName() !== 'bsc') {
    logger.info('deploying non bsc network, ignored betaWeekly_Bond')
    return
  }
  const now = moment().tz('UTC')
  await deployBond({
    name: 'weekly ebCAKE beta',
    symbol: 'ebCAKE-W-beta',
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
      ExtendableBondToken: DeployNames.betaWeekly_ExtendableBondToken,
      ExtendableBondedCake: DeployNames.betaWeekly_ExtendableBondedCake,
      BondFarmingPool: DeployNames.betaWeekly_BondFarmingPool,
      BondLPFarmingPool: DeployNames.betaWeekly_BondLPFarmingPool,
    },
  })
}
export default func
