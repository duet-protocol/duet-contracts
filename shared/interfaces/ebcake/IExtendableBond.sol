// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IExtendableBond {
  struct FeeSpec { string desc; uint16 rate; address receiver; }
  struct CheckPoints { bool convertable; uint256 convertableFrom; uint256 convertableEnd; bool redeemable; uint256 redeemableFrom; uint256 redeemableEnd; uint256 maturity; }
  function PERCENTAGE_FACTOR (  ) external view returns ( uint16  );
  function addFeeSpec ( FeeSpec calldata feeSpec_ ) external;
  function admin (  ) external view returns ( address  );
  function bondFarmingPool (  ) external view returns ( address  );
  function bondLPFarmingPool (  ) external view returns ( address  );
  function bondToken (  ) external view returns ( address  );
  function burnBondToken ( uint256 amount_ ) external;
  function calculateFeeAmount ( uint256 amount_ ) external view returns ( uint256  );
  function checkPoints (  ) external view returns ( bool convertable, uint256 convertableFrom, uint256 convertableEnd, bool redeemable, uint256 redeemableFrom, uint256 redeemableEnd, uint256 maturity );
  function convert ( uint256 amount_ ) external;
  function convertAndStake ( uint256 amount_ ) external;
  function depositAllToRemote (  ) external;
  function depositToRemote ( uint256 amount_ ) external;
  function emergencyTransferUnderlyingTokens ( address to_ ) external;
  function feeSpecs ( uint256  ) external view returns ( string calldata desc, uint16 rate, address receiver );
  function feeSpecsLength (  ) external view returns ( uint256  );
  function initialize ( address bondToken_, address underlyingToken_, address admin_ ) external;
  function keeper (  ) external view returns ( address  );
  function mintBondTokenForRewards ( address to_, uint256 amount_ ) external returns ( uint256 totalFeeAmount );
  function pause (  ) external;
  function paused (  ) external view returns ( bool  );
  function redeem ( uint256 amount_ ) external;
  function redeemAll (  ) external;
  function remoteUnderlyingAmount (  ) external view returns ( uint256  );
  function removeFeeSpec ( uint256 feeSpecIndex_ ) external;
  function setAdmin ( address newAdmin ) external;
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
}
