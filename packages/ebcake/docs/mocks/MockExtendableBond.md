# Solidity API

## MockExtendableBond

### bondToken

```solidity
contract MockBEP20 bondToken
```

### mintedRewards

```solidity
uint256 mintedRewards
```

### startBlock

```solidity
uint256 startBlock
```

### bondPool

```solidity
contract IBondFarmingPool bondPool
```

### lpPool

```solidity
contract IBondFarmingPool lpPool
```

### constructor

```solidity
constructor(contract MockBEP20 bondToken_) public
```

### setFarmingPool

```solidity
function setFarmingPool(contract IBondFarmingPool bondPool_, contract IBondFarmingPool lpPool_) external
```

### setStartBlock

```solidity
function setStartBlock(uint256 startBlock_) public
```

### totalPendingRewards

```solidity
function totalPendingRewards() public view returns (uint256)
```

### mintBondTokenForRewards

```solidity
function mintBondTokenForRewards(address to_, uint256 amount_) external
```

### updateBondPools

```solidity
function updateBondPools() external
```

### testInvalidUpdateBondPools

```solidity
function testInvalidUpdateBondPools() external
```

## MockExtendableBond

### bondToken

```solidity
contract MockBEP20 bondToken
```

### mintedRewards

```solidity
uint256 mintedRewards
```

### startBlock

```solidity
uint256 startBlock
```

### bondPool

```solidity
contract IBondFarmingPool bondPool
```

### lpPool

```solidity
contract IBondFarmingPool lpPool
```

### constructor

```solidity
constructor(contract MockBEP20 bondToken_) public
```

### setFarmingPool

```solidity
function setFarmingPool(contract IBondFarmingPool bondPool_, contract IBondFarmingPool lpPool_) external
```

### setStartBlock

```solidity
function setStartBlock(uint256 startBlock_) public
```

### totalPendingRewards

```solidity
function totalPendingRewards() public view returns (int256)
```

### mintBondTokenForRewards

```solidity
function mintBondTokenForRewards(address to_, uint256 amount_) external
```

### updateBondPools

```solidity
function updateBondPools() external
```

### testInvalidUpdateBondPools

```solidity
function testInvalidUpdateBondPools() external
```

