# Solidity API

## ICakePool

### UserInfo

```solidity
struct UserInfo {
  uint256 shares;
  uint256 lastDepositedTime;
  uint256 cakeAtLastUserAction;
  uint256 lastUserActionTime;
  uint256 lockStartTime;
  uint256 lockEndTime;
  uint256 userBoostedShare;
  bool locked;
  uint256 lockedAmount;
}
```

### MAX_LOCK_DURATION

```solidity
function MAX_LOCK_DURATION() external view returns (uint256)
```

### userInfo

```solidity
function userInfo(address user_) external view returns (struct ICakePool.UserInfo)
```

### deposit

```solidity
function deposit(uint256 _amount, uint256 _lockDuration) external
```

### withdrawByAmount

```solidity
function withdrawByAmount(uint256 _amount) external
```

### calculatePerformanceFee

```solidity
function calculatePerformanceFee(address _user) external view returns (uint256)
```

Calculate Performance fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Performance fee. |

### calculateWithdrawFee

```solidity
function calculateWithdrawFee(address _user, uint256 _shares) external view returns (uint256)
```

### calculateOverdueFee

```solidity
function calculateOverdueFee(address _user) external view returns (uint256)
```

### withdraw

```solidity
function withdraw(uint256 _shares) external
```

Withdraw funds from the Cake Pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _shares | uint256 |  |

### withdrawAll

```solidity
function withdrawAll() external
```

### getPricePerFullShare

```solidity
function getPricePerFullShare() external view returns (uint256)
```

