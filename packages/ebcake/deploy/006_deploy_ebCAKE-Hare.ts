/* eslint-disable node/no-unpublished-import,node/no-missing-import */
import { DeployFunction } from "hardhat-deploy/types";
import { deployBond } from "./.defines";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import moment from "moment-timezone";
import { useLogger } from "../scripts/utils";

moment.updateLocale("en", {
  week: {
    dow: 1
  }
});

export enum DeployNames {
  /* eslint-disable camelcase */
  ebCAKE_Hare_ExtendableBondToken = "ebCAKE_Hare_ExtendableBondToken",
  ebCAKE_Hare_ExtendableBondedCake = "ebCAKE_Hare_ExtendableBondedCake",
  ebCAKE_Hare_BondFarmingPool = "ebCAKE_Hare_BondFarmingPool",
  ebCAKE_Hare_BondLPFarmingPool = "ebCAKE_Hare_BondLPFarmingPool",
  /* eslint-enable camelcase */
}

const logger = useLogger(__filename);

export function genCheckpoints() {
  const convertableFrom = moment().tz("UTC");
  const convertableEnd = convertableFrom.clone().add("1", "quarter").endOf("quarter");
  const maturity = convertableEnd.clone().add(1, "year");
  const redeemableFrom = maturity.clone().add(1, "second");
  return {
    convertableFrom,
    convertableEnd,
    maturity,
    redeemableFrom,
    redeemableEnd: redeemableFrom.clone().add("3", "day").subtract(1, "second")
  };
}

logger.info("checkpoints", genCheckpoints());
const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  const checkpoints = genCheckpoints();
  await deployBond({
    name: "ebCAKE Hare",
    symbol: "ebCAKE-Hare",
    instancePrefix: "Yearly_",
    farm: {
      singleAllocPoint: 100,
      lpAllocPoint: 100
    },
    checkpoints: {
      convertable: true,
      convertableFrom: checkpoints.convertableFrom.unix(),
      convertableEnd: checkpoints.convertableEnd.unix(),
      redeemable: true,
      redeemableFrom: checkpoints.redeemableFrom.unix(),
      redeemableEnd: checkpoints.redeemableEnd.unix(),
      maturity: checkpoints.maturity.unix()
    },
    hre,
    deployNames: {
      ExtendableBondToken: DeployNames.ebCAKE_Hare_ExtendableBondToken,
      ExtendableBondedCake: DeployNames.ebCAKE_Hare_ExtendableBondedCake,
      BondFarmingPool: DeployNames.ebCAKE_Hare_BondFarmingPool,
      BondLPFarmingPool: DeployNames.ebCAKE_Hare_BondLPFarmingPool
    }
  });
};
export default func;
