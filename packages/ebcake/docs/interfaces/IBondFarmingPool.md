# Solidity API

## IBondFarmingPool

### stake

```solidity
function stake(uint256 amount_) external
```

### stakeForUser

```solidity
function stakeForUser(address user_, uint256 amount_) external
```

### updatePool

```solidity
function updatePool() external
```

### totalPendingRewards

```solidity
function totalPendingRewards() external view returns (uint256)
```

### lastUpdatedPoolAt

```solidity
function lastUpdatedPoolAt() external view returns (uint256)
```

### setSiblingPool

```solidity
function setSiblingPool(contract IBondFarmingPool siblingPool_) external
```

### siblingPool

```solidity
function siblingPool() external view returns (contract IBondFarmingPool)
```

