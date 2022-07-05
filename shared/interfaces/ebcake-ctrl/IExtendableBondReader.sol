// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IExtendableBondReader {
  struct ExtendableBondLpStakePackageUserInfo { uint256 lpStake_underlyingStaked; uint256 lpStake_bondStaked; uint256 lpStake_lpStaked; uint256 lpStake_ebPendingRewards; uint256 lpStake_lpClaimedRewards; uint256 lpStake_bDuetPendingRewards; uint256 lpStake_bDuetClaimedRewards; }
  struct ExtendableBondPackagePublicInfo { string name; string symbol; uint8 decimals; uint256 underlyingUsdPrice; uint256 bondUnderlyingPrice; bool convertable; uint256 convertableFrom; uint256 convertableEnd; bool redeemable; uint256 redeemableFrom; uint256 redeemableEnd; uint256 maturity; uint256 underlyingAPY; uint256 singleStake_totalStaked; uint256 singleStake_bDuetAPR; uint256 lpStake_totalStaked; uint256 lpStake_bDuetAPR; }
  struct ExtendableBondSingleStakePackageUserInfo { int256 singleStake_staked; int256 singleStake_ebEarnedToDate; uint256 singleStake_bDuetPendingRewards; uint256 singleStake_bDuetClaimedRewards; }
  function extendableBondLpStakePackageUserInfo ( address eb_ ) external view returns ( ExtendableBondLpStakePackageUserInfo memory  );
  function extendableBondPackagePublicInfo ( address eb_ ) external view returns ( ExtendableBondPackagePublicInfo memory  );
  function extendableBondSingleStakePackageUserInfo ( address eb_ ) external view returns ( ExtendableBondSingleStakePackageUserInfo memory  );
}
