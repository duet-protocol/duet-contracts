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

### AddressBook

```solidity
struct AddressBook {
  address underlyingToken;
  address bondToken;
  address lpToken;
  address bondFarmingPool;
  address bondLpFarmingPool;
  address multiRewardsMasterChef;
  uint256 bondFarmingPoolId;
  uint256 bondLpFarmingPoolId;
  address pancakePool;
}
```

### entrypoint

```solidity
contract ExtendableBondAdmin entrypoint
```

### pancakePool

```solidity
contract CakePool pancakePool
```

### pancakeMasterChef

```solidity
contract MasterChefV2 pancakeMasterChef
```

### pairTokenAddress__CAKE_BUSD

```solidity
contract IPancakePair pairTokenAddress__CAKE_BUSD
```

### pairTokenAddress__DUET_BUSD

```solidity
contract IPancakePair pairTokenAddress__DUET_BUSD
```

### pairTokenAddress__DUET_CAKE

```solidity
contract IPancakePair pairTokenAddress__DUET_CAKE
```

### constructor

```solidity
constructor(contract ExtendableBondAdmin entrypoint_, contract CakePool pancakePool_, contract MasterChefV2 pancakeMasterChef_, contract IPancakePair pairTokenAddress__CAKE_BUSD_, contract IPancakePair pairTokenAddress__DUET_BUSD_, contract IPancakePair pairTokenAddress__DUET_CAKE_) public
```

### addressBook

```solidity
function addressBook(contract ExtendableBondedCake eb_) external view returns (struct ExtendableBondedCakeReader.AddressBook book)
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

