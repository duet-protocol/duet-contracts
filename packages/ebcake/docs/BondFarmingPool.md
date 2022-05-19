# Solidity API

## BondFarmingPool

### bondToken

```solidity
contract IERC20 bondToken
```

### bond

```solidity
contract IExtendableBond bond
```

### totalShares

```solidity
uint256 totalShares
```

### lastUpdatedPoolAt

```solidity
uint256 lastUpdatedPoolAt
```

### siblingPool

```solidity
contract IBondFarmingPool siblingPool
```

### masterChef

```solidity
contract MultiRewardsMasterChef masterChef
```

### masterChefPid

```solidity
uint256 masterChefPid
```

### UserInfo

```solidity
struct UserInfo {
  uint256 shares;
  int256 accNetStaked;
}
```

### usersInfo

```solidity
mapping(address &#x3D;&gt; struct BondFarmingPool.UserInfo) usersInfo
```

### Staked

```solidity
event Staked(address user, uint256 amount)
```

### Unstaked

```solidity
event Unstaked(address user, uint256 amount)
```

### constructor

```solidity
constructor(contract IERC20 bondToken_, contract IExtendableBond bond_) public
```

### setMasterChef

```solidity
function setMasterChef(contract MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public
```

### setSiblingPool

```solidity
function setSiblingPool(contract IBondFarmingPool siblingPool_) public
```

### claimBonuses

```solidity
function claimBonuses() public
```

### updatePool

```solidity
function updatePool() external
```

_see: _updatePool_

### _updatePool

```solidity
function _updatePool() internal
```

_allocate pending rewards._

### earnedToDate

```solidity
function earnedToDate(address user_) public view returns (int256)
```

_calculate earned amount to date of specific user._

### totalPendingRewards

```solidity
function totalPendingRewards() public view virtual returns (uint256)
```

### pendingRewardsByShares

```solidity
function pendingRewardsByShares(uint256 shares_) public view returns (uint256)
```

### sharesToBondAmount

```solidity
function sharesToBondAmount(uint256 shares_) public view returns (uint256)
```

### amountToShares

```solidity
function amountToShares(uint256 amount_) public view returns (uint256)
```

### underlyingAmount

```solidity
function underlyingAmount() public view returns (uint256)
```

### stake

```solidity
function stake(uint256 amount_) public
```

### stakeForUser

```solidity
function stakeForUser(address user_, uint256 amount_) public
```

### _updatePools

```solidity
function _updatePools() internal
```

### unstakeAll

```solidity
function unstakeAll() public
```

### unstake

```solidity
function unstake(uint256 shares_) public
```

unstake by shares

## BondFarmingPool

### bondToken

```solidity
contract IERC20 bondToken
```

### bond

```solidity
contract IExtendableBond bond
```

### totalShares

```solidity
uint256 totalShares
```

### lastUpdatedPoolAt

```solidity
uint256 lastUpdatedPoolAt
```

### siblingPool

```solidity
contract IBondFarmingPool siblingPool
```

### masterChef

```solidity
contract MultiRewardsMasterChef masterChef
```

### masterChefPid

```solidity
uint256 masterChefPid
```

### UserInfo

```solidity
struct UserInfo {
  uint256 shares;
  int256 accNetStaked;
}
```

### usersInfo

```solidity
mapping(address &#x3D;&gt; struct BondFarmingPool.UserInfo) usersInfo
```

### Staked

```solidity
event Staked(address user, uint256 amount)
```

### Unstaked

```solidity
event Unstaked(address user, uint256 amount)
```

### constructor

```solidity
constructor(contract IERC20 bondToken_, contract IExtendableBond bond_) public
```

### setMasterChef

```solidity
function setMasterChef(contract MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public
```

### setSiblingPool

```solidity
function setSiblingPool(contract IBondFarmingPool siblingPool_) public
```

### claimBonuses

```solidity
function claimBonuses() public
```

### updatePool

```solidity
function updatePool() external
```

_see: _updatePool_

### _updatePool

```solidity
function _updatePool() internal
```

_allocate pending rewards._

### earnedToDate

```solidity
function earnedToDate(address user_) public view returns (int256)
```

_calculate earned amount to date of specific user._

### totalPendingRewards

```solidity
function totalPendingRewards() public view virtual returns (uint256)
```

### pendingRewardsByShares

```solidity
function pendingRewardsByShares(uint256 shares_) public view returns (uint256)
```

### sharesToBondAmount

```solidity
function sharesToBondAmount(uint256 shares_) public view returns (uint256)
```

### amountToShares

```solidity
function amountToShares(uint256 amount_) public view returns (uint256)
```

### underlyingAmount

```solidity
function underlyingAmount() public view returns (uint256)
```

### stake

```solidity
function stake(uint256 amount_) public
```

### stakeForUser

```solidity
function stakeForUser(address user_, uint256 amount_) public
```

### _updatePools

```solidity
function _updatePools() internal
```

### unstakeAll

```solidity
function unstakeAll() public
```

### unstake

```solidity
function unstake(uint256 shares_) public
```

unstake by shares
