# Solidity API

## IBoostContract

### onCakePoolUpdate

```solidity
function onCakePoolUpdate(address _user, uint256 _lockedAmount, uint256 _lockedDuration, uint256 _totalLockedAmount, uint256 _maxLockDuration) external
```

## IMasterChefV2

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
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

## IVCake

### deposit

```solidity
function deposit(address _user, uint256 _amount, uint256 _lockDuration) external
```

### withdraw

```solidity
function withdraw(address _user) external
```

## CakePool

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

### token

```solidity
contract IERC20 token
```

### masterchefV2

```solidity
contract IMasterChefV2 masterchefV2
```

### boostContract

```solidity
address boostContract
```

### VCake

```solidity
address VCake
```

### userInfo

```solidity
mapping(address &#x3D;&gt; struct CakePool.UserInfo) userInfo
```

### freePerformanceFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freePerformanceFeeUsers
```

### freeWithdrawFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freeWithdrawFeeUsers
```

### freeOverdueFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freeOverdueFeeUsers
```

### totalShares

```solidity
uint256 totalShares
```

### admin

```solidity
address admin
```

### treasury

```solidity
address treasury
```

### operator

```solidity
address operator
```

### cakePoolPID

```solidity
uint256 cakePoolPID
```

### totalBoostDebt

```solidity
uint256 totalBoostDebt
```

### totalLockedAmount

```solidity
uint256 totalLockedAmount
```

### MAX_PERFORMANCE_FEE

```solidity
uint256 MAX_PERFORMANCE_FEE
```

### MAX_WITHDRAW_FEE

```solidity
uint256 MAX_WITHDRAW_FEE
```

### MAX_OVERDUE_FEE

```solidity
uint256 MAX_OVERDUE_FEE
```

### MAX_WITHDRAW_FEE_PERIOD

```solidity
uint256 MAX_WITHDRAW_FEE_PERIOD
```

### MIN_LOCK_DURATION

```solidity
uint256 MIN_LOCK_DURATION
```

### MAX_LOCK_DURATION_LIMIT

```solidity
uint256 MAX_LOCK_DURATION_LIMIT
```

### BOOST_WEIGHT_LIMIT

```solidity
uint256 BOOST_WEIGHT_LIMIT
```

### PRECISION_FACTOR

```solidity
uint256 PRECISION_FACTOR
```

### PRECISION_FACTOR_SHARE

```solidity
uint256 PRECISION_FACTOR_SHARE
```

### MIN_DEPOSIT_AMOUNT

```solidity
uint256 MIN_DEPOSIT_AMOUNT
```

### MIN_WITHDRAW_AMOUNT

```solidity
uint256 MIN_WITHDRAW_AMOUNT
```

### UNLOCK_FREE_DURATION

```solidity
uint256 UNLOCK_FREE_DURATION
```

### MAX_LOCK_DURATION

```solidity
uint256 MAX_LOCK_DURATION
```

### DURATION_FACTOR

```solidity
uint256 DURATION_FACTOR
```

### DURATION_FACTOR_OVERDUE

```solidity
uint256 DURATION_FACTOR_OVERDUE
```

### BOOST_WEIGHT

```solidity
uint256 BOOST_WEIGHT
```

### performanceFee

```solidity
uint256 performanceFee
```

### performanceFeeContract

```solidity
uint256 performanceFeeContract
```

### withdrawFee

```solidity
uint256 withdrawFee
```

### withdrawFeeContract

```solidity
uint256 withdrawFeeContract
```

### overdueFee

```solidity
uint256 overdueFee
```

### withdrawFeePeriod

```solidity
uint256 withdrawFeePeriod
```

### Deposit

```solidity
event Deposit(address sender, uint256 amount, uint256 shares, uint256 duration, uint256 lastDepositedTime)
```

### Withdraw

```solidity
event Withdraw(address sender, uint256 amount, uint256 shares)
```

### Harvest

```solidity
event Harvest(address sender, uint256 amount)
```

### Pause

```solidity
event Pause()
```

### Unpause

```solidity
event Unpause()
```

### Init

```solidity
event Init()
```

### Lock

```solidity
event Lock(address sender, uint256 lockedAmount, uint256 shares, uint256 lockedDuration, uint256 blockTimestamp)
```

### Unlock

```solidity
event Unlock(address sender, uint256 amount, uint256 blockTimestamp)
```

### NewAdmin

```solidity
event NewAdmin(address admin)
```

### NewTreasury

```solidity
event NewTreasury(address treasury)
```

### NewOperator

```solidity
event NewOperator(address operator)
```

### NewBoostContract

```solidity
event NewBoostContract(address boostContract)
```

### NewVCakeContract

```solidity
event NewVCakeContract(address VCake)
```

### FreeFeeUser

```solidity
event FreeFeeUser(address user, bool free)
```

### NewPerformanceFee

```solidity
event NewPerformanceFee(uint256 performanceFee)
```

### NewPerformanceFeeContract

```solidity
event NewPerformanceFeeContract(uint256 performanceFeeContract)
```

### NewWithdrawFee

```solidity
event NewWithdrawFee(uint256 withdrawFee)
```

### NewOverdueFee

```solidity
event NewOverdueFee(uint256 overdueFee)
```

### NewWithdrawFeeContract

```solidity
event NewWithdrawFeeContract(uint256 withdrawFeeContract)
```

### NewWithdrawFeePeriod

```solidity
event NewWithdrawFeePeriod(uint256 withdrawFeePeriod)
```

### NewMaxLockDuration

```solidity
event NewMaxLockDuration(uint256 maxLockDuration)
```

### NewDurationFactor

```solidity
event NewDurationFactor(uint256 durationFactor)
```

### NewDurationFactorOverdue

```solidity
event NewDurationFactorOverdue(uint256 durationFactorOverdue)
```

### NewUnlockFreeDuration

```solidity
event NewUnlockFreeDuration(uint256 unlockFreeDuration)
```

### NewBoostWeight

```solidity
event NewBoostWeight(uint256 boostWeight)
```

### constructor

```solidity
constructor(contract IERC20 _token, contract IMasterChefV2 _masterchefV2, address _admin, address _treasury, address _operator, uint256 _pid) public
```

Constructor

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | contract IERC20 |  |
| _masterchefV2 | contract IMasterChefV2 |  |
| _admin | address |  |
| _treasury | address |  |
| _operator | address |  |
| _pid | uint256 |  |

### init

```solidity
function init(contract IERC20 dummyToken) external
```

Deposits a dummy token to &#x60;MASTER_CHEF&#x60; MCV2.
It will transfer all the &#x60;dummyToken&#x60; in the tx sender address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| dummyToken | contract IERC20 | The address of the token to be deposited into MCV2. |

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Checks if the msg.sender is the admin address.

### onlyOperatorOrCakeOwner

```solidity
modifier onlyOperatorOrCakeOwner(address _user)
```

Checks if the msg.sender is either the cake owner address or the operator address.

### updateBoostContractInfo

```solidity
function updateBoostContractInfo(address _user) internal
```

Update user info in Boost Contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### updateUserShare

```solidity
function updateUserShare(address _user) internal
```

Update user share When need to unlock or charges a fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### unlock

```solidity
function unlock(address _user) external
```

Unlock user cake funds.

_Only possible when contract not paused._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### deposit

```solidity
function deposit(uint256 _amount, uint256 _lockDuration) external
```

Deposit funds into the Cake Pool.

_Only possible when contract not paused._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |
| _lockDuration | uint256 |  |

### depositOperation

```solidity
function depositOperation(uint256 _amount, uint256 _lockDuration, address _user) internal
```

The operation of deposite.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |
| _lockDuration | uint256 |  |
| _user | address |  |

### withdrawByAmount

```solidity
function withdrawByAmount(uint256 _amount) public
```

Withdraw funds from the Cake Pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |

### withdraw

```solidity
function withdraw(uint256 _shares) public
```

Withdraw funds from the Cake Pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _shares | uint256 |  |

### withdrawOperation

```solidity
function withdrawOperation(uint256 _shares, uint256 _amount) internal
```

The operation of withdraw.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _shares | uint256 |  |
| _amount | uint256 |  |

### withdrawAll

```solidity
function withdrawAll() external
```

Withdraw all funds for a user

### harvest

```solidity
function harvest() internal
```

Harvest pending CAKE tokens from MasterChef

### setAdmin

```solidity
function setAdmin(address _admin) external
```

Set admin address

_Only callable by the contract owner._

### setTreasury

```solidity
function setTreasury(address _treasury) external
```

Set treasury address

_Only callable by the contract owner._

### setOperator

```solidity
function setOperator(address _operator) external
```

Set operator address

_Callable by the contract owner._

### setBoostContract

```solidity
function setBoostContract(address _boostContract) external
```

Set Boost Contract address

_Callable by the contract admin._

### setVCakeContract

```solidity
function setVCakeContract(address _VCake) external
```

Set VCake Contract address

_Callable by the contract admin._

### setFreePerformanceFeeUser

```solidity
function setFreePerformanceFeeUser(address _user, bool _free) external
```

Set free performance fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setOverdueFeeUser

```solidity
function setOverdueFeeUser(address _user, bool _free) external
```

Set free overdue fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setWithdrawFeeUser

```solidity
function setWithdrawFeeUser(address _user, bool _free) external
```

Set free withdraw fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setPerformanceFee

```solidity
function setPerformanceFee(uint256 _performanceFee) external
```

Set performance fee

_Only callable by the contract admin._

### setPerformanceFeeContract

```solidity
function setPerformanceFeeContract(uint256 _performanceFeeContract) external
```

Set performance fee for contract

_Only callable by the contract admin._

### setWithdrawFee

```solidity
function setWithdrawFee(uint256 _withdrawFee) external
```

Set withdraw fee

_Only callable by the contract admin._

### setOverdueFee

```solidity
function setOverdueFee(uint256 _overdueFee) external
```

Set overdue fee

_Only callable by the contract admin._

### setWithdrawFeeContract

```solidity
function setWithdrawFeeContract(uint256 _withdrawFeeContract) external
```

Set withdraw fee for contract

_Only callable by the contract admin._

### setWithdrawFeePeriod

```solidity
function setWithdrawFeePeriod(uint256 _withdrawFeePeriod) external
```

Set withdraw fee period

_Only callable by the contract admin._

### setMaxLockDuration

```solidity
function setMaxLockDuration(uint256 _maxLockDuration) external
```

Set MAX_LOCK_DURATION

_Only callable by the contract admin._

### setDurationFactor

```solidity
function setDurationFactor(uint256 _durationFactor) external
```

Set DURATION_FACTOR

_Only callable by the contract admin._

### setDurationFactorOverdue

```solidity
function setDurationFactorOverdue(uint256 _durationFactorOverdue) external
```

Set DURATION_FACTOR_OVERDUE

_Only callable by the contract admin._

### setUnlockFreeDuration

```solidity
function setUnlockFreeDuration(uint256 _unlockFreeDuration) external
```

Set UNLOCK_FREE_DURATION

_Only callable by the contract admin._

### setBoostWeight

```solidity
function setBoostWeight(uint256 _boostWeight) external
```

Set BOOST_WEIGHT

_Only callable by the contract admin._

### inCaseTokensGetStuck

```solidity
function inCaseTokensGetStuck(address _token) external
```

Withdraw unexpected tokens sent to the Cake Pool

### pause

```solidity
function pause() external
```

Trigger stopped state

_Only possible when contract not paused._

### unpause

```solidity
function unpause() external
```

Return to normal state

_Only possible when contract is paused._

### calculatePerformanceFee

```solidity
function calculatePerformanceFee(address _user) public view returns (uint256)
```

Calculate Performance fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Performance fee. |

### calculateOverdueFee

```solidity
function calculateOverdueFee(address _user) public view returns (uint256)
```

Calculate overdue fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Overdue fee. |

### calculatePerformanceFeeOrOverdueFee

```solidity
function calculatePerformanceFeeOrOverdueFee(address _user) internal view returns (uint256)
```

Calculate Performance Fee Or Overdue Fee

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns  Performance Fee Or Overdue Fee. |

### calculateWithdrawFee

```solidity
function calculateWithdrawFee(address _user, uint256 _shares) public view returns (uint256)
```

Calculate withdraw fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _shares | uint256 |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Withdraw fee. |

### calculateTotalPendingCakeRewards

```solidity
function calculateTotalPendingCakeRewards() public view returns (uint256)
```

Calculates the total pending rewards that can be harvested

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns total pending cake rewards |

### getPricePerFullShare

```solidity
function getPricePerFullShare() external view returns (uint256)
```

### available

```solidity
function available() public view returns (uint256)
```

Current pool available balance

_The contract puts 100% of the tokens to work._

### balanceOf

```solidity
function balanceOf() public view returns (uint256)
```

Calculates the total underlying tokens

_It includes tokens held by the contract and the boost debt amount._

### _isContract

```solidity
function _isContract(address addr) internal view returns (bool)
```

Checks if address is a contract

## IBoostContract

### onCakePoolUpdate

```solidity
function onCakePoolUpdate(address _user, uint256 _lockedAmount, uint256 _lockedDuration, uint256 _totalLockedAmount, uint256 _maxLockDuration) external
```

## IMasterChefV2

### deposit

```solidity
function deposit(uint256 _pid, uint256 _amount) external
```

### withdraw

```solidity
function withdraw(uint256 _pid, uint256 _amount) external
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

## IVCake

### deposit

```solidity
function deposit(address _user, uint256 _amount, uint256 _lockDuration) external
```

### withdraw

```solidity
function withdraw(address _user) external
```

## CakePool

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

### token

```solidity
contract IERC20 token
```

### masterchefV2

```solidity
contract IMasterChefV2 masterchefV2
```

### boostContract

```solidity
address boostContract
```

### VCake

```solidity
address VCake
```

### userInfo

```solidity
mapping(address &#x3D;&gt; struct CakePool.UserInfo) userInfo
```

### freePerformanceFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freePerformanceFeeUsers
```

### freeWithdrawFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freeWithdrawFeeUsers
```

### freeOverdueFeeUsers

```solidity
mapping(address &#x3D;&gt; bool) freeOverdueFeeUsers
```

### totalShares

```solidity
uint256 totalShares
```

### admin

```solidity
address admin
```

### treasury

```solidity
address treasury
```

### operator

```solidity
address operator
```

### cakePoolPID

```solidity
uint256 cakePoolPID
```

### totalBoostDebt

```solidity
uint256 totalBoostDebt
```

### totalLockedAmount

```solidity
uint256 totalLockedAmount
```

### MAX_PERFORMANCE_FEE

```solidity
uint256 MAX_PERFORMANCE_FEE
```

### MAX_WITHDRAW_FEE

```solidity
uint256 MAX_WITHDRAW_FEE
```

### MAX_OVERDUE_FEE

```solidity
uint256 MAX_OVERDUE_FEE
```

### MAX_WITHDRAW_FEE_PERIOD

```solidity
uint256 MAX_WITHDRAW_FEE_PERIOD
```

### MIN_LOCK_DURATION

```solidity
uint256 MIN_LOCK_DURATION
```

### MAX_LOCK_DURATION_LIMIT

```solidity
uint256 MAX_LOCK_DURATION_LIMIT
```

### BOOST_WEIGHT_LIMIT

```solidity
uint256 BOOST_WEIGHT_LIMIT
```

### PRECISION_FACTOR

```solidity
uint256 PRECISION_FACTOR
```

### PRECISION_FACTOR_SHARE

```solidity
uint256 PRECISION_FACTOR_SHARE
```

### MIN_DEPOSIT_AMOUNT

```solidity
uint256 MIN_DEPOSIT_AMOUNT
```

### MIN_WITHDRAW_AMOUNT

```solidity
uint256 MIN_WITHDRAW_AMOUNT
```

### UNLOCK_FREE_DURATION

```solidity
uint256 UNLOCK_FREE_DURATION
```

### MAX_LOCK_DURATION

```solidity
uint256 MAX_LOCK_DURATION
```

### DURATION_FACTOR

```solidity
uint256 DURATION_FACTOR
```

### DURATION_FACTOR_OVERDUE

```solidity
uint256 DURATION_FACTOR_OVERDUE
```

### BOOST_WEIGHT

```solidity
uint256 BOOST_WEIGHT
```

### performanceFee

```solidity
uint256 performanceFee
```

### performanceFeeContract

```solidity
uint256 performanceFeeContract
```

### withdrawFee

```solidity
uint256 withdrawFee
```

### withdrawFeeContract

```solidity
uint256 withdrawFeeContract
```

### overdueFee

```solidity
uint256 overdueFee
```

### withdrawFeePeriod

```solidity
uint256 withdrawFeePeriod
```

### Deposit

```solidity
event Deposit(address sender, uint256 amount, uint256 shares, uint256 duration, uint256 lastDepositedTime)
```

### Withdraw

```solidity
event Withdraw(address sender, uint256 amount, uint256 shares)
```

### Harvest

```solidity
event Harvest(address sender, uint256 amount)
```

### Pause

```solidity
event Pause()
```

### Unpause

```solidity
event Unpause()
```

### Init

```solidity
event Init()
```

### Lock

```solidity
event Lock(address sender, uint256 lockedAmount, uint256 shares, uint256 lockedDuration, uint256 blockTimestamp)
```

### Unlock

```solidity
event Unlock(address sender, uint256 amount, uint256 blockTimestamp)
```

### NewAdmin

```solidity
event NewAdmin(address admin)
```

### NewTreasury

```solidity
event NewTreasury(address treasury)
```

### NewOperator

```solidity
event NewOperator(address operator)
```

### NewBoostContract

```solidity
event NewBoostContract(address boostContract)
```

### NewVCakeContract

```solidity
event NewVCakeContract(address VCake)
```

### FreeFeeUser

```solidity
event FreeFeeUser(address user, bool free)
```

### NewPerformanceFee

```solidity
event NewPerformanceFee(uint256 performanceFee)
```

### NewPerformanceFeeContract

```solidity
event NewPerformanceFeeContract(uint256 performanceFeeContract)
```

### NewWithdrawFee

```solidity
event NewWithdrawFee(uint256 withdrawFee)
```

### NewOverdueFee

```solidity
event NewOverdueFee(uint256 overdueFee)
```

### NewWithdrawFeeContract

```solidity
event NewWithdrawFeeContract(uint256 withdrawFeeContract)
```

### NewWithdrawFeePeriod

```solidity
event NewWithdrawFeePeriod(uint256 withdrawFeePeriod)
```

### NewMaxLockDuration

```solidity
event NewMaxLockDuration(uint256 maxLockDuration)
```

### NewDurationFactor

```solidity
event NewDurationFactor(uint256 durationFactor)
```

### NewDurationFactorOverdue

```solidity
event NewDurationFactorOverdue(uint256 durationFactorOverdue)
```

### NewUnlockFreeDuration

```solidity
event NewUnlockFreeDuration(uint256 unlockFreeDuration)
```

### NewBoostWeight

```solidity
event NewBoostWeight(uint256 boostWeight)
```

### constructor

```solidity
constructor(contract IERC20 _token, contract IMasterChefV2 _masterchefV2, address _admin, address _treasury, address _operator, uint256 _pid) public
```

Constructor

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | contract IERC20 |  |
| _masterchefV2 | contract IMasterChefV2 |  |
| _admin | address |  |
| _treasury | address |  |
| _operator | address |  |
| _pid | uint256 |  |

### init

```solidity
function init(contract IERC20 dummyToken) external
```

Deposits a dummy token to &#x60;MASTER_CHEF&#x60; MCV2.
It will transfer all the &#x60;dummyToken&#x60; in the tx sender address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| dummyToken | contract IERC20 | The address of the token to be deposited into MCV2. |

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Checks if the msg.sender is the admin address.

### onlyOperatorOrCakeOwner

```solidity
modifier onlyOperatorOrCakeOwner(address _user)
```

Checks if the msg.sender is either the cake owner address or the operator address.

### updateBoostContractInfo

```solidity
function updateBoostContractInfo(address _user) internal
```

Update user info in Boost Contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### updateUserShare

```solidity
function updateUserShare(address _user) internal
```

Update user share When need to unlock or charges a fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### unlock

```solidity
function unlock(address _user) external
```

Unlock user cake funds.

_Only possible when contract not paused._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

### deposit

```solidity
function deposit(uint256 _amount, uint256 _lockDuration) external
```

Deposit funds into the Cake Pool.

_Only possible when contract not paused._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |
| _lockDuration | uint256 |  |

### depositOperation

```solidity
function depositOperation(uint256 _amount, uint256 _lockDuration, address _user) internal
```

The operation of deposite.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |
| _lockDuration | uint256 |  |
| _user | address |  |

### withdrawByAmount

```solidity
function withdrawByAmount(uint256 _amount) public
```

Withdraw funds from the Cake Pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 |  |

### withdraw

```solidity
function withdraw(uint256 _shares) public
```

Withdraw funds from the Cake Pool.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _shares | uint256 |  |

### withdrawOperation

```solidity
function withdrawOperation(uint256 _shares, uint256 _amount) internal
```

The operation of withdraw.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _shares | uint256 |  |
| _amount | uint256 |  |

### withdrawAll

```solidity
function withdrawAll() external
```

Withdraw all funds for a user

### harvest

```solidity
function harvest() internal
```

Harvest pending CAKE tokens from MasterChef

### setAdmin

```solidity
function setAdmin(address _admin) external
```

Set admin address

_Only callable by the contract owner._

### setTreasury

```solidity
function setTreasury(address _treasury) external
```

Set treasury address

_Only callable by the contract owner._

### setOperator

```solidity
function setOperator(address _operator) external
```

Set operator address

_Callable by the contract owner._

### setBoostContract

```solidity
function setBoostContract(address _boostContract) external
```

Set Boost Contract address

_Callable by the contract admin._

### setVCakeContract

```solidity
function setVCakeContract(address _VCake) external
```

Set VCake Contract address

_Callable by the contract admin._

### setFreePerformanceFeeUser

```solidity
function setFreePerformanceFeeUser(address _user, bool _free) external
```

Set free performance fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setOverdueFeeUser

```solidity
function setOverdueFeeUser(address _user, bool _free) external
```

Set free overdue fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setWithdrawFeeUser

```solidity
function setWithdrawFeeUser(address _user, bool _free) external
```

Set free withdraw fee address

_Only callable by the contract admin._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _free | bool |  |

### setPerformanceFee

```solidity
function setPerformanceFee(uint256 _performanceFee) external
```

Set performance fee

_Only callable by the contract admin._

### setPerformanceFeeContract

```solidity
function setPerformanceFeeContract(uint256 _performanceFeeContract) external
```

Set performance fee for contract

_Only callable by the contract admin._

### setWithdrawFee

```solidity
function setWithdrawFee(uint256 _withdrawFee) external
```

Set withdraw fee

_Only callable by the contract admin._

### setOverdueFee

```solidity
function setOverdueFee(uint256 _overdueFee) external
```

Set overdue fee

_Only callable by the contract admin._

### setWithdrawFeeContract

```solidity
function setWithdrawFeeContract(uint256 _withdrawFeeContract) external
```

Set withdraw fee for contract

_Only callable by the contract admin._

### setWithdrawFeePeriod

```solidity
function setWithdrawFeePeriod(uint256 _withdrawFeePeriod) external
```

Set withdraw fee period

_Only callable by the contract admin._

### setMaxLockDuration

```solidity
function setMaxLockDuration(uint256 _maxLockDuration) external
```

Set MAX_LOCK_DURATION

_Only callable by the contract admin._

### setDurationFactor

```solidity
function setDurationFactor(uint256 _durationFactor) external
```

Set DURATION_FACTOR

_Only callable by the contract admin._

### setDurationFactorOverdue

```solidity
function setDurationFactorOverdue(uint256 _durationFactorOverdue) external
```

Set DURATION_FACTOR_OVERDUE

_Only callable by the contract admin._

### setUnlockFreeDuration

```solidity
function setUnlockFreeDuration(uint256 _unlockFreeDuration) external
```

Set UNLOCK_FREE_DURATION

_Only callable by the contract admin._

### setBoostWeight

```solidity
function setBoostWeight(uint256 _boostWeight) external
```

Set BOOST_WEIGHT

_Only callable by the contract admin._

### inCaseTokensGetStuck

```solidity
function inCaseTokensGetStuck(address _token) external
```

Withdraw unexpected tokens sent to the Cake Pool

### pause

```solidity
function pause() external
```

Trigger stopped state

_Only possible when contract not paused._

### unpause

```solidity
function unpause() external
```

Return to normal state

_Only possible when contract is paused._

### calculatePerformanceFee

```solidity
function calculatePerformanceFee(address _user) public view returns (uint256)
```

Calculate Performance fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Performance fee. |

### calculateOverdueFee

```solidity
function calculateOverdueFee(address _user) public view returns (uint256)
```

Calculate overdue fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Overdue fee. |

### calculatePerformanceFeeOrOverdueFee

```solidity
function calculatePerformanceFeeOrOverdueFee(address _user) internal view returns (uint256)
```

Calculate Performance Fee Or Overdue Fee

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns  Performance Fee Or Overdue Fee. |

### calculateWithdrawFee

```solidity
function calculateWithdrawFee(address _user, uint256 _shares) public view returns (uint256)
```

Calculate withdraw fee.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address |  |
| _shares | uint256 |  |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns Withdraw fee. |

### calculateTotalPendingCakeRewards

```solidity
function calculateTotalPendingCakeRewards() public view returns (uint256)
```

Calculates the total pending rewards that can be harvested

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns total pending cake rewards |

### getPricePerFullShare

```solidity
function getPricePerFullShare() external view returns (uint256)
```

### available

```solidity
function available() public view returns (uint256)
```

Current pool available balance

_The contract puts 100% of the tokens to work._

### balanceOf

```solidity
function balanceOf() public view returns (uint256)
```

Calculates the total underlying tokens

_It includes tokens held by the contract and the boost debt amount._

### _isContract

```solidity
function _isContract(address addr) internal view returns (bool)
```

Checks if address is a contract

