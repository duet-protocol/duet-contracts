// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IExtendableBondedReaderCake {
  struct AddressBook { address underlyingToken; address bondToken; address lpToken; address bondFarmingPool; address bondLpFarmingPool; uint256 bondFarmingPoolId; uint256 bondLpFarmingPoolId; address pancakePool; }
  struct ExtendableBondGroupInfo { uint256 allEbStacked; uint256 ebCommonPriceAsUsd; uint256 duetSideAPR; uint256 underlyingSideAPR; }
  struct ExtendableBondLpStakePackageUserInfo { uint256 lpStake_underlyingStaked; uint256 lpStake_bondStaked; uint256 lpStake_lpStaked; uint256 lpStake_ebPendingRewards; uint256 lpStake_lpClaimedRewards; uint256 lpStake_bDuetPendingRewards; uint256 lpStake_bDuetClaimedRewards; }
  struct ExtendableBondPackagePublicInfo { string name; string symbol; uint8 decimals; uint256 underlyingUsdPrice; uint256 bondUnderlyingPrice; bool convertable; uint256 convertableFrom; uint256 convertableEnd; bool redeemable; uint256 redeemableFrom; uint256 redeemableEnd; uint256 maturity; uint256 underlyingAPY; uint256 singleStake_totalStaked; uint256 singleStake_bDuetAPR; uint256 lpStake_totalStaked; uint256 lpStake_bDuetAPR; }
  struct ExtendableBondSingleStakePackageUserInfo { int256 singleStake_staked; int256 singleStake_ebEarnedToDate; uint256 singleStake_bDuetPendingRewards; uint256 singleStake_bDuetClaimedRewards; }
  function addressBook ( address eb_ ) external view returns ( AddressBook memory book );
  function admin (  ) external view returns ( address  );
  function extendableBondGroupInfo ( string calldata groupName_ ) external view returns ( ExtendableBondGroupInfo memory  );
  function extendableBondLpStakePackageUserInfo ( address eb_ ) external view returns ( ExtendableBondLpStakePackageUserInfo memory  );
  function extendableBondPackagePublicInfo ( address eb_ ) external view returns ( ExtendableBondPackagePublicInfo memory  );
  function extendableBondSingleStakePackageUserInfo ( address eb_ ) external view returns ( ExtendableBondSingleStakePackageUserInfo memory  );
  function initialize ( address admin_, address registry_, address pancakePool_, address pancakeMasterChef_, address pairTokenAddress__CAKE_BUSD_, address pairTokenAddress__DUET_anyUSD_ ) external;
  function pairTokenAddress__CAKE_BUSD (  ) external view returns ( address  );
  function pairTokenAddress__DUET_anyUSD (  ) external view returns ( address  );
  function pancakeMasterChef (  ) external view returns ( address  );
  function pancakePool (  ) external view returns ( address  );
  function registry (  ) external view returns ( address  );
  function setAdmin ( address newAdmin ) external;
  function updateReferences ( address registry_, address pancakePool_, address pancakeMasterChef_, address pairTokenAddress__CAKE_BUSD_, address pairTokenAddress__DUET_anyUSD_ ) external;
}
