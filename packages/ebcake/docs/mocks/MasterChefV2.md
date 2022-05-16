# Solidity API

## IMasterChef

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
```

### enterStaking

```solidity
function enterStaking(uint256 _amount) external
```

### leaveStaking

```solidity
function leaveStaking(uint256 _amount) external
```

### pendingCake

```solidity
function pendingCake(uint256 _pid, address _user) external view returns (uint256)
```

### userInfo

```solidity
function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256)
```

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) external
```

## MasterChefV2

The (older) MasterChef contract gives out a constant number of CAKE tokens per block.
It is the only address with minting rights for CAKE.
The idea for this MasterChef V2 (MCV2) contract is therefore to be the owner of a dummy token
that is deposited into the MasterChef V1 (MCV1) contract.
The allocation point for this pool on MCV1 is the total allocation point for all pools that receive incentives.

### UserInfo

```solidity
struct UserInfo {
  uint256 amount;
  uint256 rewardDebt;
  uint256 boostMultiplier;
}
```

### PoolInfo

```solidity
struct PoolInfo {
  uint256 accCakePerShare;
  uint256 lastRewardBlock;
  uint256 allocPoint;
  uint256 totalBoostedShare;
  bool isRegular;
}
```

### MASTER_CHEF

```solidity
contract IMasterChef MASTER_CHEF
```

Address of MCV1 contract.

### CAKE

```solidity
contract IBEP20 CAKE
```

Address of CAKE contract.

### burnAdmin

```solidity
address burnAdmin
```

The only address can withdraw all the burn CAKE.

### boostContract

```solidity
address boostContract
```

The contract handles the share boosts.

### poolInfo

```solidity
struct MasterChefV2.PoolInfo[] poolInfo
```

Info of each MCV2 pool.

### lpToken

```solidity
contract IBEP20[] lpToken
```

Address of the LP token for each MCV2 pool.

### userInfo

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; struct MasterChefV2.UserInfo)) userInfo
```

Info of each pool user.

### whiteList

```solidity
mapping(address &#x3D;&gt; bool) whiteList
```

The whitelist of addresses allowed to deposit in special pools.

### MASTER_PID

```solidity
uint256 MASTER_PID
```

The pool id of the MCV2 mock token pool in MCV1.

### totalRegularAllocPoint

```solidity
uint256 totalRegularAllocPoint
```

Total regular allocation points. Must be the sum of all regular pools&#x27; allocation points.

### totalSpecialAllocPoint

```solidity
uint256 totalSpecialAllocPoint
```

Total special allocation points. Must be the sum of all special pools&#x27; allocation points.

### MASTERCHEF_CAKE_PER_BLOCK

```solidity
uint256 MASTERCHEF_CAKE_PER_BLOCK
```

@notice 40 cakes per block in MCV1

### ACC_CAKE_PRECISION

```solidity
uint256 ACC_CAKE_PRECISION
```

### BOOST_PRECISION

```solidity
uint256 BOOST_PRECISION
```

Basic boost factor, none boosted user&#x27;s boost factor

### MAX_BOOST_PRECISION

```solidity
uint256 MAX_BOOST_PRECISION
```

Hard limit for maxmium boost factor, it must greater than BOOST_PRECISION

### CAKE_RATE_TOTAL_PRECISION

```solidity
uint256 CAKE_RATE_TOTAL_PRECISION
```

total cake rate &#x3D; toBurn + toRegular + toSpecial

### cakeRateToBurn

```solidity
uint256 cakeRateToBurn
```

The last block number of CAKE burn action being executed.
CAKE distribute % for burn

### cakeRateToRegularFarm

```solidity
uint256 cakeRateToRegularFarm
```

CAKE distribute % for regular farm pool

### cakeRateToSpecialFarm

```solidity
uint256 cakeRateToSpecialFarm
```

CAKE distribute % for special pools

### lastBurnedBlock

```solidity
uint256 lastBurnedBlock
```

### Init

```solidity
event Init()
```

### AddPool

```solidity
event AddPool(uint256 pid, uint256 allocPoint, contract IBEP20 lpToken, bool isRegular)
```

### SetPool

```solidity
event SetPool(uint256 pid, uint256 allocPoint)
```

### UpdatePool

```solidity
event UpdatePool(uint256 pid, uint256 lastRewardBlock, uint256 lpSupply, uint256 accCakePerShare)
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

### UpdateCakeRate

```solidity
event UpdateCakeRate(uint256 burnRate, uint256 regularFarmRate, uint256 specialFarmRate)
```

### UpdateBurnAdmin

```solidity
event UpdateBurnAdmin(address oldAdmin, address newAdmin)
```

### UpdateWhiteList

```solidity
event UpdateWhiteList(address user, bool isValid)
```

### UpdateBoostContract

```solidity
event UpdateBoostContract(address boostContract)
```

### UpdateBoostMultiplier

```solidity
event UpdateBoostMultiplier(address user, uint256 pid, uint256 oldMultiplier, uint256 newMultiplier)
```

### constructor

```solidity
constructor(contract IMasterChef _MASTER_CHEF, contract IBEP20 _CAKE, uint256 _MASTER_PID, address _burnAdmin) public
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _MASTER_CHEF | contract IMasterChef | The PancakeSwap MCV1 contract address. |
| _CAKE | contract IBEP20 | The CAKE token contract address. |
| _MASTER_PID | uint256 | The pool id of the dummy pool on the MCV1. |
| _burnAdmin | address | The address of burn admin. |

### onlyBoostContract

```solidity
modifier onlyBoostContract()
```

_Throws if caller is not the boost contract._

### init

```solidity
function init(contract IBEP20 dummyToken) external
```

Deposits a dummy token to &#x60;MASTER_CHEF&#x60; MCV1. This is required because MCV1 holds the minting permission of CAKE.
It will transfer all the &#x60;dummyToken&#x60; in the tx sender address.
The allocation point for the dummy pool on MCV1 should be equal to the total amount of allocPoint.

| Name | Type | Description |
| ---- | ---- | ----------- |
| dummyToken | contract IBEP20 | The address of the BEP-20 token to be deposited into MCV1. |

### poolLength

```solidity
function poolLength() public view returns (uint256 pools)
```

Returns the number of MCV2 pools.

### add

```solidity
function add(uint256 _allocPoint, contract IBEP20 _lpToken, bool _isRegular, bool _withUpdate) external
```

Add a new pool. Can only be called by the owner.
DO NOT add the same LP token more than once. Rewards will be messed up if you do.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _allocPoint | uint256 | Number of allocation points for the new pool. |
| _lpToken | contract IBEP20 | Address of the LP BEP-20 token. |
| _isRegular | bool | Whether the pool is regular or special. LP farms are always &quot;regular&quot;. &quot;Special&quot; pools are |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. only for CAKE distributions within PancakeSwap products. |

### set

```solidity
function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external
```

Update the given pool&#x27;s CAKE allocation point. Can only be called by the owner.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _allocPoint | uint256 | New number of allocation points for the pool. |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### pendingCake

```solidity
function pendingCake(uint256 _pid, address _user) external view returns (uint256)
```

View function for checking pending CAKE rewards.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _user | address | Address of the user. |

### massUpdatePools

```solidity
function massUpdatePools() public
```

Update cake reward for all the active pools. Be careful of gas spending!

### cakePerBlock

```solidity
function cakePerBlock(bool _isRegular) public view returns (uint256 amount)
```

Calculates and returns the &#x60;amount&#x60; of CAKE per block.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isRegular | bool | If the pool belongs to regular or special. |

### cakePerBlockToBurn

```solidity
function cakePerBlockToBurn() public view returns (uint256 amount)
```

Calculates and returns the &#x60;amount&#x60; of CAKE per block to burn.

### updatePool

```solidity
function updatePool(uint256 _pid) public returns (struct MasterChefV2.PoolInfo pool)
```

Update reward variables for the given pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | struct MasterChefV2.PoolInfo | Returns the pool that was updated. |

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

Deposit LP tokens to pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _amount | uint256 | Amount of LP tokens to deposit. |

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
```

Withdraw LP tokens from pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _amount | uint256 | Amount of LP tokens to withdraw. |

### harvestFromMasterChef

```solidity
function harvestFromMasterChef() public
```

Harvests CAKE from &#x60;MASTER_CHEF&#x60; MCV1 and pool &#x60;MASTER_PID&#x60; to MCV2.

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) external
```

Withdraw without caring about the rewards. EMERGENCY ONLY.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |

### burnCake

```solidity
function burnCake(bool _withUpdate) public
```

Send CAKE pending for burn to &#x60;burnAdmin&#x60;.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### updateCakeRate

```solidity
function updateCakeRate(uint256 _burnRate, uint256 _regularFarmRate, uint256 _specialFarmRate, bool _withUpdate) external
```

Update the % of CAKE distributions for burn, regular pools and special pools.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _burnRate | uint256 | The % of CAKE to burn each block. |
| _regularFarmRate | uint256 | The % of CAKE to regular pools each block. |
| _specialFarmRate | uint256 | The % of CAKE to special pools each block. |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### updateBurnAdmin

```solidity
function updateBurnAdmin(address _newAdmin) external
```

Update burn admin address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newAdmin | address | The new burn admin address. |

### updateWhiteList

```solidity
function updateWhiteList(address _user, bool _isValid) external
```

Update whitelisted addresses for special pools.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address to be updated. |
| _isValid | bool | The flag for valid or invalid. |

### updateBoostContract

```solidity
function updateBoostContract(address _newBoostContract) external
```

Update boost contract address and max boost factor.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newBoostContract | address | The new address for handling all the share boosts. |

### updateBoostMultiplier

```solidity
function updateBoostMultiplier(address _user, uint256 _pid, uint256 _newMultiplier) external
```

Update user boost factor.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address for boost factor updates. |
| _pid | uint256 | The pool id for the boost factor updates. |
| _newMultiplier | uint256 | New boost multiplier. |

### getBoostMultiplier

```solidity
function getBoostMultiplier(address _user, uint256 _pid) public view returns (uint256)
```

Get user boost multiplier for specific pool id.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address. |
| _pid | uint256 | The pool id. |

### settlePendingCake

```solidity
function settlePendingCake(address _user, uint256 _pid, uint256 _boostMultiplier) internal
```

Settles, distribute the pending CAKE rewards for given user.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address for settling rewards. |
| _pid | uint256 | The pool id. |
| _boostMultiplier | uint256 | The user boost multiplier in specific pool id. |

### _safeTransfer

```solidity
function _safeTransfer(address _to, uint256 _amount) internal
```

Safe Transfer CAKE.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The CAKE receiver address. |
| _amount | uint256 | transfer CAKE amounts. |

## IMasterChef

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
```

### enterStaking

```solidity
function enterStaking(uint256 _amount) external
```

### leaveStaking

```solidity
function leaveStaking(uint256 _amount) external
```

### pendingCake

```solidity
function pendingCake(uint256 _pid, address _user) external view returns (uint256)
```

### userInfo

```solidity
function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256)
```

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) external
```

## MasterChefV2

The (older) MasterChef contract gives out a constant number of CAKE tokens per block.
It is the only address with minting rights for CAKE.
The idea for this MasterChef V2 (MCV2) contract is therefore to be the owner of a dummy token
that is deposited into the MasterChef V1 (MCV1) contract.
The allocation point for this pool on MCV1 is the total allocation point for all pools that receive incentives.

### UserInfo

```solidity
struct UserInfo {
  uint256 amount;
  uint256 rewardDebt;
  uint256 boostMultiplier;
}
```

### PoolInfo

```solidity
struct PoolInfo {
  uint256 accCakePerShare;
  uint256 lastRewardBlock;
  uint256 allocPoint;
  uint256 totalBoostedShare;
  bool isRegular;
}
```

### MASTER_CHEF

```solidity
contract IMasterChef MASTER_CHEF
```

Address of MCV1 contract.

### CAKE

```solidity
contract IBEP20 CAKE
```

Address of CAKE contract.

### burnAdmin

```solidity
address burnAdmin
```

The only address can withdraw all the burn CAKE.

### boostContract

```solidity
address boostContract
```

The contract handles the share boosts.

### poolInfo

```solidity
struct MasterChefV2.PoolInfo[] poolInfo
```

Info of each MCV2 pool.

### lpToken

```solidity
contract IBEP20[] lpToken
```

Address of the LP token for each MCV2 pool.

### userInfo

```solidity
mapping(uint256 &#x3D;&gt; mapping(address &#x3D;&gt; struct MasterChefV2.UserInfo)) userInfo
```

Info of each pool user.

### whiteList

```solidity
mapping(address &#x3D;&gt; bool) whiteList
```

The whitelist of addresses allowed to deposit in special pools.

### MASTER_PID

```solidity
uint256 MASTER_PID
```

The pool id of the MCV2 mock token pool in MCV1.

### totalRegularAllocPoint

```solidity
uint256 totalRegularAllocPoint
```

Total regular allocation points. Must be the sum of all regular pools&#x27; allocation points.

### totalSpecialAllocPoint

```solidity
uint256 totalSpecialAllocPoint
```

Total special allocation points. Must be the sum of all special pools&#x27; allocation points.

### MASTERCHEF_CAKE_PER_BLOCK

```solidity
uint256 MASTERCHEF_CAKE_PER_BLOCK
```

@notice 40 cakes per block in MCV1

### ACC_CAKE_PRECISION

```solidity
uint256 ACC_CAKE_PRECISION
```

### BOOST_PRECISION

```solidity
uint256 BOOST_PRECISION
```

Basic boost factor, none boosted user&#x27;s boost factor

### MAX_BOOST_PRECISION

```solidity
uint256 MAX_BOOST_PRECISION
```

Hard limit for maxmium boost factor, it must greater than BOOST_PRECISION

### CAKE_RATE_TOTAL_PRECISION

```solidity
uint256 CAKE_RATE_TOTAL_PRECISION
```

total cake rate &#x3D; toBurn + toRegular + toSpecial

### cakeRateToBurn

```solidity
uint256 cakeRateToBurn
```

The last block number of CAKE burn action being executed.
CAKE distribute % for burn

### cakeRateToRegularFarm

```solidity
uint256 cakeRateToRegularFarm
```

CAKE distribute % for regular farm pool

### cakeRateToSpecialFarm

```solidity
uint256 cakeRateToSpecialFarm
```

CAKE distribute % for special pools

### lastBurnedBlock

```solidity
uint256 lastBurnedBlock
```

### Init

```solidity
event Init()
```

### AddPool

```solidity
event AddPool(uint256 pid, uint256 allocPoint, contract IBEP20 lpToken, bool isRegular)
```

### SetPool

```solidity
event SetPool(uint256 pid, uint256 allocPoint)
```

### UpdatePool

```solidity
event UpdatePool(uint256 pid, uint256 lastRewardBlock, uint256 lpSupply, uint256 accCakePerShare)
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

### UpdateCakeRate

```solidity
event UpdateCakeRate(uint256 burnRate, uint256 regularFarmRate, uint256 specialFarmRate)
```

### UpdateBurnAdmin

```solidity
event UpdateBurnAdmin(address oldAdmin, address newAdmin)
```

### UpdateWhiteList

```solidity
event UpdateWhiteList(address user, bool isValid)
```

### UpdateBoostContract

```solidity
event UpdateBoostContract(address boostContract)
```

### UpdateBoostMultiplier

```solidity
event UpdateBoostMultiplier(address user, uint256 pid, uint256 oldMultiplier, uint256 newMultiplier)
```

### constructor

```solidity
constructor(contract IMasterChef _MASTER_CHEF, contract IBEP20 _CAKE, uint256 _MASTER_PID, address _burnAdmin) public
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _MASTER_CHEF | contract IMasterChef | The PancakeSwap MCV1 contract address. |
| _CAKE | contract IBEP20 | The CAKE token contract address. |
| _MASTER_PID | uint256 | The pool id of the dummy pool on the MCV1. |
| _burnAdmin | address | The address of burn admin. |

### onlyBoostContract

```solidity
modifier onlyBoostContract()
```

_Throws if caller is not the boost contract._

### init

```solidity
function init(contract IBEP20 dummyToken) external
```

Deposits a dummy token to &#x60;MASTER_CHEF&#x60; MCV1. This is required because MCV1 holds the minting permission of CAKE.
It will transfer all the &#x60;dummyToken&#x60; in the tx sender address.
The allocation point for the dummy pool on MCV1 should be equal to the total amount of allocPoint.

| Name | Type | Description |
| ---- | ---- | ----------- |
| dummyToken | contract IBEP20 | The address of the BEP-20 token to be deposited into MCV1. |

### poolLength

```solidity
function poolLength() public view returns (uint256 pools)
```

Returns the number of MCV2 pools.

### add

```solidity
function add(uint256 _allocPoint, contract IBEP20 _lpToken, bool _isRegular, bool _withUpdate) external
```

Add a new pool. Can only be called by the owner.
DO NOT add the same LP token more than once. Rewards will be messed up if you do.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _allocPoint | uint256 | Number of allocation points for the new pool. |
| _lpToken | contract IBEP20 | Address of the LP BEP-20 token. |
| _isRegular | bool | Whether the pool is regular or special. LP farms are always &quot;regular&quot;. &quot;Special&quot; pools are |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. only for CAKE distributions within PancakeSwap products. |

### set

```solidity
function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external
```

Update the given pool&#x27;s CAKE allocation point. Can only be called by the owner.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _allocPoint | uint256 | New number of allocation points for the pool. |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### pendingCake

```solidity
function pendingCake(uint256 _pid, address _user) external view returns (uint256)
```

View function for checking pending CAKE rewards.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _user | address | Address of the user. |

### massUpdatePools

```solidity
function massUpdatePools() public
```

Update cake reward for all the active pools. Be careful of gas spending!

### cakePerBlock

```solidity
function cakePerBlock(bool _isRegular) public view returns (uint256 amount)
```

Calculates and returns the &#x60;amount&#x60; of CAKE per block.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isRegular | bool | If the pool belongs to regular or special. |

### cakePerBlockToBurn

```solidity
function cakePerBlockToBurn() public view returns (uint256 amount)
```

Calculates and returns the &#x60;amount&#x60; of CAKE per block to burn.

### updatePool

```solidity
function updatePool(uint256 _pid) public returns (struct MasterChefV2.PoolInfo pool)
```

Update reward variables for the given pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | struct MasterChefV2.PoolInfo | Returns the pool that was updated. |

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

Deposit LP tokens to pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _amount | uint256 | Amount of LP tokens to deposit. |

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
```

Withdraw LP tokens from pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |
| _amount | uint256 | Amount of LP tokens to withdraw. |

### harvestFromMasterChef

```solidity
function harvestFromMasterChef() public
```

Harvests CAKE from &#x60;MASTER_CHEF&#x60; MCV1 and pool &#x60;MASTER_PID&#x60; to MCV2.

### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 _pid) external
```

Withdraw without caring about the rewards. EMERGENCY ONLY.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pid | uint256 | The id of the pool. See &#x60;poolInfo&#x60;. |

### burnCake

```solidity
function burnCake(bool _withUpdate) public
```

Send CAKE pending for burn to &#x60;burnAdmin&#x60;.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### updateCakeRate

```solidity
function updateCakeRate(uint256 _burnRate, uint256 _regularFarmRate, uint256 _specialFarmRate, bool _withUpdate) external
```

Update the % of CAKE distributions for burn, regular pools and special pools.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _burnRate | uint256 | The % of CAKE to burn each block. |
| _regularFarmRate | uint256 | The % of CAKE to regular pools each block. |
| _specialFarmRate | uint256 | The % of CAKE to special pools each block. |
| _withUpdate | bool | Whether call &quot;massUpdatePools&quot; operation. |

### updateBurnAdmin

```solidity
function updateBurnAdmin(address _newAdmin) external
```

Update burn admin address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newAdmin | address | The new burn admin address. |

### updateWhiteList

```solidity
function updateWhiteList(address _user, bool _isValid) external
```

Update whitelisted addresses for special pools.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The address to be updated. |
| _isValid | bool | The flag for valid or invalid. |

### updateBoostContract

```solidity
function updateBoostContract(address _newBoostContract) external
```

Update boost contract address and max boost factor.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newBoostContract | address | The new address for handling all the share boosts. |

### updateBoostMultiplier

```solidity
function updateBoostMultiplier(address _user, uint256 _pid, uint256 _newMultiplier) external
```

Update user boost factor.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address for boost factor updates. |
| _pid | uint256 | The pool id for the boost factor updates. |
| _newMultiplier | uint256 | New boost multiplier. |

### getBoostMultiplier

```solidity
function getBoostMultiplier(address _user, uint256 _pid) public view returns (uint256)
```

Get user boost multiplier for specific pool id.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address. |
| _pid | uint256 | The pool id. |

### settlePendingCake

```solidity
function settlePendingCake(address _user, uint256 _pid, uint256 _boostMultiplier) internal
```

Settles, distribute the pending CAKE rewards for given user.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | The user address for settling rewards. |
| _pid | uint256 | The pool id. |
| _boostMultiplier | uint256 | The user boost multiplier in specific pool id. |

### _safeTransfer

```solidity
function _safeTransfer(address _to, uint256 _amount) internal
```

Safe Transfer CAKE.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _to | address | The CAKE receiver address. |
| _amount | uint256 | transfer CAKE amounts. |

