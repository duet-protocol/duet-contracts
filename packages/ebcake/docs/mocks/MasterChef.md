# Solidity API

## IMigratorChef

### migrate

```solidity
function migrate(contract IBEP20 token) external returns (contract IBEP20)
```

## MasterChef

### UserInfo

```solidity
struct UserInfo {
  uint256 amount;
  uint256 rewardDebt;
}
```

### PoolInfo

```solidity
struct PoolInfo {
  contract IBEP20 lpToken;
  uint256 allocPoint;
  uint256 lastRewardBlock;
  uint256 accCakePerShare;
}
```

### cake

```solidity
contract CakeToken cake
```

### syrup

```solidity
contract SyrupBar syrup
```

### devaddr

```solidity
address devaddr
```

### cakePerBlock

```solidity
uint256 cakePerBlock
```

### BONUS_MULTIPLIER

```solidity
uint256 BONUS_MULTIPLIER
```

### migrator

```solidity
contract IMigratorChef migrator
```

### poolInfo

```solidity
struct MasterChef.PoolInfo[] poolInfo
```

### userInfo

```solidity
mapping(uint256 => mapping(address => struct MasterChef.UserInfo)) userInfo
```

### totalAllocPoint

```solidity
uint256 totalAllocPoint
```

### startBlock

```solidity
uint256 startBlock
```

### Deposit

```solidity
event Deposit(address user, uint256 pid, uint256 amount)
```

### Withdraw

```solidity
event Withdraw(address user, uint256 pid, uint256 amount)
```

### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address user, uint256 pid, uint256 amount)
```

### constructor

```solidity
constructor(contract CakeToken _cake, contract SyrupBar _syrup, address _devaddr, uint256 _cakePerBlock, uint256 _startBlock) public
```

### updateMultiplier

```solidity
function updateMultiplier(uint256 multiplierNumber) public
```

### poolLength

```solidity
function poolLength() external view returns (uint256)
```

### add

```solidity
function add(uint256 _allocPoint, contract IBEP20 _lpToken, bool _withUpdate) public
```

### set

```solidity
function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public
```

### updateStakingPool

```solidity
function updateStakingPool() internal
```

### setMigrator

```solidity
function setMigrator(contract IMigratorChef _migrator) public
```

### migrate

```solidity
function migrate(uint256 _pid) public
```

### getMultiplier

```solidity
function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256)
```

### pendingCake

```solidity
function pendingCake(uint256 _pid, address _user) external view returns (uint256)
```

### massUpdatePools

```solidity
function massUpdatePools() public
```

### updatePool

```solidity
function updatePool(uint256 _pid) public
```

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) public
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) public
```

### enterStaking

```solidity
function enterStaking(uint256 _amount) public
```

### leaveStaking

```solidity
function leaveStaking(uint256 _amount) public
```

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) public
```

### safeCakeTransfer

```solidity
function safeCakeTransfer(address _to, uint256 _amount) internal
```

### dev

```solidity
function dev(address _devaddr) public
```

