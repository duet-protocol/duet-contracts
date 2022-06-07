# Solidity API

## BOOST_WEIGHT

```solidity
uint256 BOOST_WEIGHT
```

## DURATION_FACTOR

```solidity
uint256 DURATION_FACTOR
```

## PRECISION_FACTOR

```solidity
uint256 PRECISION_FACTOR
```

## WEI_PER_EHTER

```solidity
uint256 WEI_PER_EHTER
```

## PANCAKE_CAKE_POOL_ID

```solidity
uint256 PANCAKE_CAKE_POOL_ID
```

## ExtendableBondedCakeReader

### ExtendableBondGroupInfo

```solidity
struct ExtendableBondGroupInfo {
  uint256 allEbStacked;
  uint256 ebCommonPriceAsUsd;
  uint256 duetSideAPR;
  uint256 underlyingSideAPR;
}
```

### admin

```solidity
contract ExtendableBondAdmin admin
```

### pairTokenAddress__CAKE_BUSD

```solidity
contract IPancakePair pairTokenAddress__CAKE_BUSD
```

### pairTokenAddress__DUET_CAKE

```solidity
contract IPancakePair pairTokenAddress__DUET_CAKE
```

### pancakePool

```solidity
contract CakePool pancakePool
```

### pancakeMasterChef

```solidity
contract MasterChefV2 pancakeMasterChef
```

### constructor

```solidity
constructor(contract ExtendableBondAdmin admin_, contract IPancakePair pairTokenAddress__CAKE_BUSD_, contract IPancakePair pairTokenAddress__DUET_CAKE_, contract CakePool pancakePool_, contract MasterChefV2 pancakeMasterChef_) public
```

### bondLpPancakeFarmingPoolMasterChefAddress

```solidity
function bondLpPancakeFarmingPoolMasterChefAddress(contract ExtendableBond eb_) external view returns (address)
```

### bondLpPancakeFarmingPoolMasterChefPoolId

```solidity
function bondLpPancakeFarmingPoolMasterChefPoolId(contract ExtendableBond eb_) external view returns (uint256)
```

### cakePoolAddress

```solidity
function cakePoolAddress(contract ExtendableBondedCake eb_) external view returns (address)
```

### cakeTokenAddress

```solidity
function cakeTokenAddress(contract ExtendableBondedCake eb_) external view returns (address)
```

### extendableBondGroupInfo

```solidity
function extendableBondGroupInfo(string groupName_) external view returns (struct ExtendableBondedCakeReader.ExtendableBondGroupInfo)
```

### _unsafely_getDuetPriceAsUsd

```solidity
function _unsafely_getDuetPriceAsUsd(contract ExtendableBond eb_) internal view returns (uint256)
```

Estimates token price by multi-fetching data from DEX.
There are some issues like time-lag and precision problems.
It's OK to do estimation but not for trading basis.

### _unsafely_getUnderlyingPriceAsUsd

```solidity
function _unsafely_getUnderlyingPriceAsUsd(contract ExtendableBond eb_) internal view returns (uint256)
```

Estimates token price by multi-fetching data from DEX.
There are some issues like time-lag and precision problems.
It's OK to do estimation but not for trading basis.

### _getBondPriceAsUnderlying

```solidity
function _getBondPriceAsUnderlying(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getLpStackedReserves

```solidity
function _getLpStackedReserves(contract ExtendableBond eb_) internal view returns (uint256 cakeReserve, uint256 ebCakeReserve)
```

### _getLpStackedTotalSupply

```solidity
function _getLpStackedTotalSupply(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getEbFarmingPoolId

```solidity
function _getEbFarmingPoolId(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getUnderlyingAPY

```solidity
function _getUnderlyingAPY(contract ExtendableBond eb_) internal view returns (uint256)
```

### _getPancakeSyrupAPR

```solidity
function _getPancakeSyrupAPR() internal view returns (uint256)
```

