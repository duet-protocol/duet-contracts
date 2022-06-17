# Solidity API

## BondLPFarmingPool

### bondToken

```solidity
contract IERC20Upgradeable bondToken
```

### lpToken

```solidity
contract IERC20Upgradeable lpToken
```

### bond

```solidity
contract IExtendableBond bond
```

### siblingPool

```solidity
contract IBondFarmingPool siblingPool
```

### lastUpdatedPoolAt

```solidity
uint256 lastUpdatedPoolAt
```

### masterChef

```solidity
contract MultiRewardsMasterChef masterChef
```

### masterChefPid

```solidity
uint256 masterChefPid
```

### accRewardPerShare

```solidity
uint256 accRewardPerShare
```

_accumulated bond token rewards of each lp token._

### ACC_REWARDS_PRECISION

```solidity
uint256 ACC_REWARDS_PRECISION
```

### totalLpAmount

```solidity
uint256 totalLpAmount
```

### bondRewardsSuspended

```solidity
bool bondRewardsSuspended
```

mark bond reward is suspended. If the LP Token needs to be migrated, such as from pancake to ESP, the bond rewards will be suspended.
you can not stake anymore when bond rewards has been suspended.

__updatePools() no longer works after bondRewardsSuspended is true._

### UserInfo

```solidity
struct UserInfo {
  uint256 lpAmount;
  uint256 rewardDebt;
  uint256 pendingRewards;
  uint256 claimedRewards;
}
```

### usersInfo

```solidity
mapping(address => struct BondLPFarmingPool.UserInfo) usersInfo
```

### Staked

```solidity
event Staked(address user, uint256 amount)
```

### Unstaked

```solidity
event Unstaked(address user, uint256 amount)
```

### SiblingPoolUpdated

```solidity
event SiblingPoolUpdated(address previousPool, address newPool)
```

### initialize

```solidity
function initialize(contract IERC20Upgradeable bondToken_, contract IExtendableBond bond_, address admin_) public
```

### setLpToken

```solidity
function setLpToken(contract IERC20Upgradeable lpToken_) public
```

### setMasterChef

```solidity
function setMasterChef(contract MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public
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

### totalPendingRewards

```solidity
function totalPendingRewards() public view virtual returns (uint256)
```

_distribute single bond pool first, then LP pool will get the remaining rewards. see _updatePools_

### getUserPendingRewards

```solidity
function getUserPendingRewards(address user_) public view virtual returns (uint256)
```

_get pending rewards by specific user_

### setSiblingPool

```solidity
function setSiblingPool(contract IBondFarmingPool siblingPool_) public
```

### stake

```solidity
function stake(uint256 amount_) public
```

### _updatePools

```solidity
function _updatePools() internal
```

### _stakeRemote

```solidity
function _stakeRemote(address user_, uint256 amount_) internal virtual
```

### _unstakeRemote

```solidity
function _unstakeRemote(address user_, uint256 amount_) internal virtual
```

### _harvestRemote

```solidity
function _harvestRemote() internal virtual
```

### stakeForUser

```solidity
function stakeForUser(address user_, uint256 amount_) public
```

### unstake

```solidity
function unstake(uint256 amount_) public
```

unstake by shares

### unstakeAll

```solidity
function unstakeAll() public
```

### setBondRewardsSuspended

```solidity
function setBondRewardsSuspended(bool suspended_) public
```

### claimBonuses

```solidity
function claimBonuses() public
```

