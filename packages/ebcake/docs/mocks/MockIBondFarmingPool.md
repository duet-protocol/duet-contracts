# Solidity API

## MockIBondFarmingPool

### lastUpdatedPoolAt

```solidity
uint256 lastUpdatedPoolAt
```

### siblingPool

```solidity
contract IBondFarmingPool siblingPool
```

### bondToken

```solidity
contract IERC20 bondToken
```

### usersAmount

```solidity
mapping(address => uint256) usersAmount
```

### constructor

```solidity
constructor(contract IERC20 bondToken_) public
```

### stake

```solidity
function stake(uint256 amount_) public
```

### stakeForUser

```solidity
function stakeForUser(address user_, uint256 amount_) public
```

### updatePool

```solidity
function updatePool() external
```

### setSiblingPool

```solidity
function setSiblingPool(contract IBondFarmingPool siblingPool_) public
```

### totalPendingRewards

```solidity
function totalPendingRewards() external view returns (uint256)
```

