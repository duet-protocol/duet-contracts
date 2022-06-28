# Solidity API

## BondLPPancakeFarmingPool

### cakeToken

```solidity
contract IERC20Upgradeable cakeToken
```

### pancakeMasterChef

```solidity
contract IPancakeMasterChefV2 pancakeMasterChef
```

### pancakeMasterChefPid

```solidity
uint256 pancakeMasterChefPid
```

### accPancakeRewardsPerShares

```solidity
uint256 accPancakeRewardsPerShares
```

_accumulated cake rewards of each lp token._

### remoteEnabled

```solidity
bool remoteEnabled
```

It cannot be modified from true to false as this may cause accounting problems.

_whether remote staking enabled (stake to PancakeSwap LP farming pool)._

### PancakeUserInfo

```solidity
struct PancakeUserInfo {
  uint256 rewardDebt;
  uint256 pendingRewards;
  uint256 claimedRewards;
}
```

### pancakeUsersInfo

```solidity
mapping(address => struct BondLPPancakeFarmingPool.PancakeUserInfo) pancakeUsersInfo
```

### initPancake

```solidity
function initPancake(contract IERC20Upgradeable cakeToken_, contract IPancakeMasterChefV2 pancakeMasterChef_, uint256 pancakeMasterChefPid_) external
```

### remoteEnable

```solidity
function remoteEnable() external
```

_enable remote staking (stake to PancakeSwap LP farming pool)._

### _stakeBalanceToRemote

```solidity
function _stakeBalanceToRemote() internal
```

### _requirePancakeSettled

```solidity
function _requirePancakeSettled() internal view
```

### _stakeRemote

```solidity
function _stakeRemote(address user_, uint256 amount_) internal
```

_stake to pancakeswap_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_ | address | user to stake |
| amount_ | uint256 | amount to stake |

### _unstakeRemote

```solidity
function _unstakeRemote(address user_, uint256 amount_) internal
```

_unstake from pancakeswap_

| Name | Type | Description |
| ---- | ---- | ----------- |
| user_ | address | user to unstake |
| amount_ | uint256 | amount to unstake |

### _harvestRemote

```solidity
function _harvestRemote() internal
```

_harvest from pancakeswap_

