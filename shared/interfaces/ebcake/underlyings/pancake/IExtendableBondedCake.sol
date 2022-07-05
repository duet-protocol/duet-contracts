// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IExtendableBondedCake {
  struct FeeSpec { string desc; uint16 rate; address receiver; }
  struct UserInfo { uint256 shares; uint256 lastDepositedTime; uint256 cakeAtLastUserAction; uint256 lastUserActionTime; uint256 lockStartTime; uint256 lockEndTime; uint256 userBoostedShare; bool locked; uint256 lockedAmount; }
  struct CheckPoints { bool convertable; uint256 convertableFrom; uint256 convertableEnd; bool redeemable; uint256 redeemableFrom; uint256 redeemableEnd; uint256 maturity; }
  function PERCENTAGE_FACTOR (  ) external view returns ( uint16  );
  function addFeeSpec ( FeeSpec calldata feeSpec_ ) external;
  function admin (  ) external view returns ( address  );
  function bondFarmingPool (  ) external view returns ( address  );
  function bondLPFarmingPool (  ) external view returns ( address  );
  function bondToken (  ) external view returns ( address  );
  function burnBondToken ( uint256 amount_ ) external;
  function cakePool (  ) external view returns ( address  );
  function calculateFeeAmount ( uint256 amount_ ) external view returns ( uint256  );
  function checkPoints (  ) external view returns ( bool convertable, uint256 convertableFrom, uint256 convertableEnd, bool redeemable, uint256 redeemableFrom, uint256 redeemableEnd, uint256 maturity );
  function convert ( uint256 amount_ ) external;
  function convertAndStake ( uint256 amount_ ) external;
  function depositAllToRemote (  ) external;
  function depositToRemote ( uint256 amount_ ) external;
  function emergencyTransferUnderlyingTokens ( address to_ ) external;
  function extendPancakeLockDuration ( bool force_ ) external;
  function feeSpecs ( uint256  ) external view returns ( string calldata desc, uint16 rate, address receiver );
  function feeSpecsLength (  ) external view returns ( uint256  );
  function initialize ( address bondToken_, address underlyingToken_, address admin_ ) external;
  function keeper (  ) external view returns ( address  );
  function mintBondTokenForRewards ( address to_, uint256 amount_ ) external returns ( uint256 totalFeeAmount );
  function pancakeUserInfo (  ) external view returns ( UserInfo memory  );
  function pause (  ) external;
  function paused (  ) external view returns ( bool  );
  function redeem ( uint256 amount_ ) external;
  function redeemAll (  ) external;
  function remoteUnderlyingAmount (  ) external view returns ( uint256  );
  function removeFeeSpec ( uint256 feeSpecIndex_ ) external;
  function secondsToPancakeLockExtend ( bool deposit_ ) external view returns ( uint256 secondsToExtend );
  function setAdmin ( address newAdmin ) external;
  function setCakePool ( address cakePool_ ) external;
  function setConvertable ( bool convertable_ ) external;
  function setFarmingPools ( address bondPool_, address lpPool_ ) external;
  function setFeeSpec ( uint256 feeId_, FeeSpec calldata feeSpec_ ) external;
  function setKeeper ( address newKeeper ) external;
  function setRedeemable ( bool redeemable_ ) external;
  function totalBondTokenAmount (  ) external view returns ( uint256  );
  function totalPendingRewards (  ) external view returns ( uint256  );
  function totalUnderlyingAmount (  ) external view returns ( uint256  );
  function underlyingAmount (  ) external view returns ( uint256  );
  function underlyingToken (  ) external view returns ( address  );
  function unpause (  ) external;
  function updateCheckPoints ( CheckPoints calldata checkPoints_ ) external;
  function withdrawAllCakesFromPancake ( bool makeRedeemable_ ) external;
}
