# Solidity API

## ExtendableBondedCake

### cakePool

```solidity
contract ICakePool cakePool
```

CakePool contract

### setCakePool

```solidity
function setCakePool(contract ICakePool cakePool_) external
```

### remoteUnderlyingAmount

```solidity
function remoteUnderlyingAmount() public view returns (uint256)
```

_calculate cake amount from pancake._

### pancakeUserInfo

```solidity
function pancakeUserInfo() public view returns (struct ICakePool.UserInfo)
```

_calculate cake amount from pancake._

### _withdrawFromRemote

```solidity
function _withdrawFromRemote(uint256 amount_) internal
```

_withdraw from pancakeswap_

### _depositRemote

```solidity
function _depositRemote(uint256 amount_) internal
```

_deposit to pancakeswap_

### secondsToPancakeLockExtend

```solidity
function secondsToPancakeLockExtend() public view returns (uint256)
```

### withdrawAllCakesFromPancake

```solidity
function withdrawAllCakesFromPancake(bool makeRedeemable_) public
```

_Withdraw cake from cake pool._

### extendPancakeLockDuration

```solidity
function extendPancakeLockDuration() public
```

_extend pancake lock duration if needs_

