# Solidity API

## IMigratorChef

### migrate

```solidity
function migrate(contract IERC20 token) external returns (contract IERC20)
```

## MultiRewardsMasterChef

### admin

```solidity
address admin
```

### UserInfo

```solidity
struct UserInfo {
  uint256 amount;
  mapping(uint256 &#x3D;&gt; uint256) rewardDebt;
}
```

### PoolInfo

```solidity
struct PoolInfo {
  contract IERC20 lpToken;
  uint256 allocPoint;
  uint256 lastRewardBlock;
  address proxyFarmer;
  uint256 totalAmount;
}
```

### RewardInfo

```solidity
struct RewardInfo {
  contract IERC20 token;
  uint256 amount;
}
```

### RewardSpec

```solidity
struct RewardSpec {
  contract IERC20 token;
  uint256 rewardPerBlock;
  uint256 startedAtBlock;
  uint256 endedAtBlock;
  uint256 claimedAmount;
}
```

### rewardSpecs

```solidity
struct MultiRewardsMasterChef.RewardSpec[] rewardSpecs
```

### migrator

```solidity
contract IMigratorChef migrator
```

### poolInfo

```solidity
struct MultiRewardsMasterChef.PoolInfo[] poolInfo
```

### poolsRewardsAccRewardsPerShare

```solidity
mapping(uint256 &#x3D;&gt; mapping(uint256 &#x3D;&gt; uint256)) poolsRewardsAccRewardsPerShare
```

### userInfo

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; struct MultiRewardsMasterChef.UserInfo)) userInfo
```

### totalAllocPoint

```solidity
uint256 totalAllocPoint
```

### Deposit

```solidity
event Deposit(address user, uint256 pid, uint256 amount)
```

### Withdraw

```solidity
event Withdraw(address user, uint256 pid, uint256 amount)
```

### ClaimRewards

```solidity
event ClaimRewards(address user, uint256 pid)
```

### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address user, uint256 pid, uint256 amount)
```

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Checks if the msg.sender is the admin address.

### initialize

```solidity
function initialize(address admin_) public
```

### poolLength

```solidity
function poolLength() external view returns (uint256)
```

### add

```solidity
function add(uint256 _allocPoint, contract IERC20 _lpToken, address _proxyFarmer, bool _withUpdate) public
```

### set

```solidity
function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public
```

### addRewardSpec

```solidity
function addRewardSpec(contract IERC20 token, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock) public
```

### setRewardSpec

```solidity
function setRewardSpec(uint256 rewardId, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock) public
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
function getMultiplier(uint256 _from, uint256 _to, uint256 rewardId) public view returns (uint256)
```

### pendingRewards

```solidity
function pendingRewards(uint256 _pid, address _user) external view returns (struct MultiRewardsMasterChef.RewardInfo[])
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

### depositForUser

```solidity
function depositForUser(uint256 _pid, uint256 _amount, address user_) public
```

### _depositOperation

```solidity
function _depositOperation(uint256 _pid, uint256 _amount, address _user) internal
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) public
```

### withdrawForUser

```solidity
function withdrawForUser(uint256 _pid, uint256 _amount, address user_) public
```

### _withdrawOperation

```solidity
function _withdrawOperation(uint256 _pid, uint256 _amount, address _user) internal
```

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) public
```

### setAdmin

```solidity
function setAdmin(address admin_) public
```

## IMigratorChef

### migrate

```solidity
function migrate(contract IERC20 token) external returns (contract IERC20)
```

## MultiRewardsMasterChef

### admin

```solidity
address admin
```

### UserInfo

```solidity
struct UserInfo {
  uint256 amount;
  mapping(uint256 &#x3D;&gt; uint256) rewardDebt;
}
```

### PoolInfo

```solidity
struct PoolInfo {
  contract IERC20 lpToken;
  uint256 allocPoint;
  uint256 lastRewardBlock;
  address proxyFarmer;
  uint256 totalAmount;
}
```

### RewardInfo

```solidity
struct RewardInfo {
  contract IERC20 token;
  uint256 amount;
}
```

### RewardSpec

```solidity
struct RewardSpec {
  contract IERC20 token;
  uint256 rewardPerBlock;
  uint256 startedAtBlock;
  uint256 endedAtBlock;
  uint256 claimedAmount;
}
```

### rewardSpecs

```solidity
struct MultiRewardsMasterChef.RewardSpec[] rewardSpecs
```

### migrator

```solidity
contract IMigratorChef migrator
```

### poolInfo

```solidity
struct MultiRewardsMasterChef.PoolInfo[] poolInfo
```

### poolsRewardsAccRewardsPerShare

```solidity
mapping(uint256 &#x3D;&gt; mapping(uint256 &#x3D;&gt; uint256)) poolsRewardsAccRewardsPerShare
```

### userInfo

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; struct MultiRewardsMasterChef.UserInfo)) userInfo
```

### totalAllocPoint

```solidity
uint256 totalAllocPoint
```

### Deposit

```solidity
event Deposit(address user, uint256 pid, uint256 amount)
```

### Withdraw

```solidity
event Withdraw(address user, uint256 pid, uint256 amount)
```

### ClaimRewards

```solidity
event ClaimRewards(address user, uint256 pid)
```

### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address user, uint256 pid, uint256 amount)
```

### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Checks if the msg.sender is the admin address.

### initialize

```solidity
function initialize(address admin_) public
```

### poolLength

```solidity
function poolLength() external view returns (uint256)
```

### add

```solidity
function add(uint256 _allocPoint, contract IERC20 _lpToken, address _proxyFarmer, bool _withUpdate) public
```

### set

```solidity
function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public
```

### addRewardSpec

```solidity
function addRewardSpec(contract IERC20 token, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock) public
```

### setRewardSpec

```solidity
function setRewardSpec(uint256 rewardId, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock) public
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
function getMultiplier(uint256 _from, uint256 _to, uint256 rewardId) public view returns (uint256)
```

### pendingRewards

```solidity
function pendingRewards(uint256 _pid, address _user) external view returns (struct MultiRewardsMasterChef.RewardInfo[])
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

### depositForUser

```solidity
function depositForUser(uint256 _pid, uint256 _amount, address user_) public
```

### _depositOperation

```solidity
function _depositOperation(uint256 _pid, uint256 _amount, address _user) internal
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) public
```

### withdrawForUser

```solidity
function withdrawForUser(uint256 _pid, uint256 _amount, address user_) public
```

### _withdrawOperation

```solidity
function _withdrawOperation(uint256 _pid, uint256 _amount, address _user) internal
```

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) public
```

### setAdmin

```solidity
function setAdmin(address admin_) public
```

