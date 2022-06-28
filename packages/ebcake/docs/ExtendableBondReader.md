# Solidity API

## BLOCKS_PER_YEAR

```solidity
uint256 BLOCKS_PER_YEAR
```

## ExtendableBondReader

### ExtendableBondPackagePublicInfo

```solidity
struct ExtendableBondPackagePublicInfo {
  string name;
  string symbol;
  uint8 decimals;
  uint256 underlyingUsdPrice;
  uint256 bondUnderlyingPrice;
  bool convertable;
  uint256 convertableFrom;
  uint256 convertableEnd;
  bool redeemable;
  uint256 redeemableFrom;
  uint256 redeemableEnd;
  uint256 maturity;
  uint256 underlyingAPY;
  uint256 singleStake_totalStaked;
  uint256 singleStake_bDuetAPR;
  uint256 lpStake_totalStaked;
  uint256 lpStake_bDuetAPR;
}
```

### ExtendableBondSingleStakePackageUserInfo

```solidity
struct ExtendableBondSingleStakePackageUserInfo {
  int256 singleStake_staked;
  int256 singleStake_ebEarnedToDate;
  uint256 singleStake_bDuetPendingRewards;
  uint256 singleStake_bDuetClaimedRewards;
}
```

### ExtendableBondLpStakePackageUserInfo

```solidity
struct ExtendableBondLpStakePackageUserInfo {
  uint256 lpStake_underlyingStaked;
  uint256 lpStake_bondStaked;
  uint256 lpStake_lpStaked;
  uint256 lpStake_ebPendingRewards;
  uint256 lpStake_lpClaimedRewards;
  uint256 lpStake_bDuetPendingRewards;
  uint256 lpStake_bDuetClaimedRewards;
}
```

### extendableBondPackagePublicInfo

```solidity
function extendableBondPackagePublicInfo(contract ExtendableBond eb_) external view returns (struct ExtendableBondReader.ExtendableBondPackagePublicInfo)
```

### extendableBondSingleStakePackageUserInfo

```solidity
function extendableBondSingleStakePackageUserInfo(contract ExtendableBond eb_) external view returns (struct ExtendableBondReader.ExtendableBondSingleStakePackageUserInfo)
```

### extendableBondLpStakePackageUserInfo

```solidity
function extendableBondLpStakePackageUserInfo(contract ExtendableBond eb_) external view returns (struct ExtendableBondReader.ExtendableBondLpStakePackageUserInfo)
```

### _unsafely_getDuetPriceAsUsd

```solidity
function _unsafely_getDuetPriceAsUsd(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _unsafely_getUnderlyingPriceAsUsd

```solidity
function _unsafely_getUnderlyingPriceAsUsd(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _getBondPriceAsUnderlying

```solidity
function _getBondPriceAsUnderlying(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _getLpStackedReserves

```solidity
function _getLpStackedReserves(contract ExtendableBond eb_) internal view virtual returns (uint256, uint256)
```

### _getLpStackedTotalSupply

```solidity
function _getLpStackedTotalSupply(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _getEbFarmingPoolId

```solidity
function _getEbFarmingPoolId(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _getUnderlyingAPY

```solidity
function _getUnderlyingAPY(contract ExtendableBond eb_) internal view virtual returns (uint256)
```

### _getSingleStake_bDuetAPR

```solidity
function _getSingleStake_bDuetAPR(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getLpStake_bDuetAPR

```solidity
function _getLpStake_bDuetAPR(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getBDuetAPR

```solidity
function _getBDuetAPR(contract ExtendableBond eb_, uint256 pid_) internal view returns (uint256 apr)
```

### _getUserClaimedRewardsAmount

```solidity
function _getUserClaimedRewardsAmount(contract ExtendableBond eb_, uint256 pid_, address user_) internal view returns (uint256 amount)
```

### _getPendingRewardsAmount

```solidity
function _getPendingRewardsAmount(contract ExtendableBond eb_, uint256 pid_, address user_) internal view returns (uint256 amount)
```

### _getLpStakeDetail

```solidity
function _getLpStakeDetail(contract ExtendableBond eb_, uint256 lpStaked) internal view returns (uint256 lpStake_underlyingStaked, uint256 lpStake_bondStaked)
```

