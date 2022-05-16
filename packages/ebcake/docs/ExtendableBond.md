# Solidity API

## ExtendableBond

### bondToken

```solidity
contract BondToken bondToken
```

Bond token contract

### cakePool

```solidity
contract ICakePool cakePool
```

CakePool contract

### underlyingToken

```solidity
contract IERC20Upgradeable underlyingToken
```

Bond underlying asset

### PERCENTAGE_FACTOR

```solidity
uint16 PERCENTAGE_FACTOR
```

_factor for percentage that described in integer. It makes 10000 means 100%, and 20 means 0.2%;
     Calculation formula: x * percentage / PERCENTAGE_FACTOR_

### bondFarmingPool

```solidity
contract IBondFarmingPool bondFarmingPool
```

### bondLPFarmingPool

```solidity
contract IBondFarmingPool bondLPFarmingPool
```

### Converted

```solidity
event Converted(uint256 amount, address user)
```

Emitted when someone convert underlying token to the bond.

### MintedBondTokenForRewards

```solidity
event MintedBondTokenForRewards(address to, uint256 amount)
```

### FeeSpec

```solidity
struct FeeSpec {
  string desc;
  uint16 rate;
  address receiver;
}
```

### feeSpecs

```solidity
struct ExtendableBond.FeeSpec[] feeSpecs
```

Fee specifications

### CheckPoints

```solidity
struct CheckPoints {
  bool convertable;
  uint256 convertableFrom;
  uint256 convertableEnd;
  bool redeemable;
  uint256 redeemableFrom;
  uint256 redeemableEnd;
  uint256 maturity;
}
```

### checkPoints

```solidity
struct ExtendableBond.CheckPoints checkPoints
```

### onlyAdminOrKeeper

```solidity
modifier onlyAdminOrKeeper()
```

### initialize

```solidity
function initialize(contract BondToken bondToken_, contract IERC20Upgradeable underlyingToken_, contract ICakePool cakePool_, address admin_) public
```

### underlyingAmount

```solidity
function underlyingAmount() public view returns (uint256)
```

Underlying token amount that hold in current contract.

### totalUnderlyingAmount

```solidity
function totalUnderlyingAmount() public view returns (uint256)
```

total underlying token amount, including hold in current contract and cake pool

### totalPendingRewards

```solidity
function totalPendingRewards() public view returns (uint256)
```

_Total pending rewards for bond. May be negative in some unexpected circumstances,
     such as remote underlying amount has unexpectedly decreased makes bond token over issued._

### mintBondTokenForRewards

```solidity
function mintBondTokenForRewards(address to_, uint256 amount_) public
```

_mint bond token for rewards and allocate fees._

### totalBondTokenAmount

```solidity
function totalBondTokenAmount() public view returns (uint256)
```

Bond token total amount.

### remoteUnderlyingAmount

```solidity
function remoteUnderlyingAmount() public view returns (uint256)
```

calculate remote underlying token amount.

### redeemAll

```solidity
function redeemAll() external
```

_Redeem all my bond tokens to underlying tokens._

### redeem

```solidity
function redeem(uint256 amount_) public
```

_Redeem specific amount of my bond tokens._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount_ | uint256 | amount to redeem |

### secondsToPancakeLockExtend

```solidity
function secondsToPancakeLockExtend() public view returns (uint256)
```

### convert

```solidity
function convert(uint256 amount_) external
```

_convert underlying token to bond token to current user_

### requireConvertable

```solidity
function requireConvertable() internal view
```

### _updateFarmingPools

```solidity
function _updateFarmingPools() internal
```

### setFarmingPools

```solidity
function setFarmingPools(contract IBondFarmingPool bondPool_, contract IBondFarmingPool lpPool_) public
```

### convertAndStake

```solidity
function convertAndStake(uint256 amount_) external
```

_convert underlying token to bond token and stake to bondFarmingPool for current user_

### _convertOperation

```solidity
function _convertOperation(uint256 amount_, address user_) internal
```

_convert underlying token to bond token to specific user_

### extendRemoteLockDate

```solidity
function extendRemoteLockDate() public
```

### updateCheckPoints

```solidity
function updateCheckPoints(struct ExtendableBond.CheckPoints checkPoints_) public
```

### setRedeemable

```solidity
function setRedeemable(bool redeemable_) external
```

### setConvertable

```solidity
function setConvertable(bool convertable_) external
```

### withdrawRemoteUnderlyingTokens

```solidity
function withdrawRemoteUnderlyingTokens(bool makeRedeemable_) public
```

_Withdraw cake from cake pool._

### emergencyTransferUnderlyingTokens

```solidity
function emergencyTransferUnderlyingTokens(address to_) external
```

_emergency transfer underlying token for security issue or bug encounted._

### extendBond

```solidity
function extendBond(struct ExtendableBond.CheckPoints checkPoints_) public
```

### addFeeSpec

```solidity
function addFeeSpec(struct ExtendableBond.FeeSpec feeSpec_) external
```

add

### depositToRemote

```solidity
function depositToRemote(uint256 amount_) public
```

### depositAllToRemote

```solidity
function depositAllToRemote() public
```

### removeFeeSpec

```solidity
function removeFeeSpec(uint256 feeSpecIndex) external
```

### setKeeper

```solidity
function setKeeper(address newKeeper) external
```

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

## ExtendableBond

### admin

```solidity
address admin
```

address of administrator

### bondToken

```solidity
contract BondToken bondToken
```

Bond token contract

### cakePool

```solidity
contract ICakePool cakePool
```

CakePool contract

### underlyingToken

```solidity
contract IERC20Upgradeable underlyingToken
```

Bond underlying asset

### PERCENTAGE_FACTOR

```solidity
uint16 PERCENTAGE_FACTOR
```

_factor for percentage that described in integer. It makes 10000 means 100%, and 20 means 0.2%;
     Calculation formula: x * percentage / PERCENTAGE_FACTOR_

### bondFarmingPool

```solidity
contract IBondFarmingPool bondFarmingPool
```

### bondLPFarmingPool

```solidity
contract IBondFarmingPool bondLPFarmingPool
```

### NewAdmin

```solidity
event NewAdmin(address admin)
```

Emitted when the admin changes

### Converted

```solidity
event Converted(uint256 amount, address user)
```

Emitted when someone convert underlying token to the bond.

### MintedBondTokenForRewards

```solidity
event MintedBondTokenForRewards(address to, uint256 amount)
```

### FeeSpec

```solidity
struct FeeSpec {
  string desc;
  uint16 rate;
  address receiver;
}
```

### feeSpecs

```solidity
struct ExtendableBond.FeeSpec[] feeSpecs
```

Fee specifications

### CheckPoints

```solidity
struct CheckPoints {
  bool convertable;
  uint256 convertableFrom;
  uint256 convertableEnd;
  bool redeemable;
  uint256 redeemableFrom;
  uint256 redeemableEnd;
  uint256 maturity;
}
```

### checkPoints

```solidity
struct ExtendableBond.CheckPoints checkPoints
```

### initialize

```solidity
function initialize(contract BondToken bondToken_, contract IERC20Upgradeable underlyingToken_, contract ICakePool cakePool_, address admin_) public
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Checks if the msg.sender is the admin address.

### underlyingAmount

```solidity
function underlyingAmount() public view returns (uint256)
```

Underlying token amount that hold in current contract.

### totalUnderlyingAmount

```solidity
function totalUnderlyingAmount() public view returns (uint256)
```

total underlying token amount, including hold in current contract and cake pool

### totalPendingRewards

```solidity
function totalPendingRewards() public view returns (int256)
```

_Total pending rewards for bond. May be negative in some unexpected circumstances,
     such as remote underlying amount has unexpectedly decreased makes bond token over issued._

### mintBondTokenForRewards

```solidity
function mintBondTokenForRewards(address to_, uint256 amount_) public
```

_mint bond token for rewards and allocate fees._

### totalBondTokenAmount

```solidity
function totalBondTokenAmount() public view returns (uint256)
```

Bond token total amount.

### remoteUnderlyingAmount

```solidity
function remoteUnderlyingAmount() public view returns (uint256)
```

calculate remote underlying token amount.

### redeemAll

```solidity
function redeemAll() external
```

_Redeem all my bond tokens to underlying tokens._

### redeem

```solidity
function redeem(uint256 amount_) public
```

_Redeem specific amount of my bond tokens._

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount_ | uint256 | amount to redeem |

### secondsToPancakeLockExtend

```solidity
function secondsToPancakeLockExtend() public view returns (uint256)
```

### convert

```solidity
function convert(uint256 amount_) external
```

_convert underlying token to bond token to current user_

### requireConvertable

```solidity
function requireConvertable() internal view
```

### updateFarmingPools

```solidity
function updateFarmingPools() internal
```

### setFarmingPools

```solidity
function setFarmingPools(contract IBondFarmingPool bondPool_, contract IBondFarmingPool lpPool_) public
```

### convertAndStake

```solidity
function convertAndStake(uint256 amount_) external
```

_convert underlying token to bond token and stake to bondFarmingPool for current user_

### _convertOperation

```solidity
function _convertOperation(uint256 amount_, address user_) internal
```

_convert underlying token to bond token to specific user_

### updateCheckPoints

```solidity
function updateCheckPoints(struct ExtendableBond.CheckPoints checkPoints_) public
```

### setRedeemable

```solidity
function setRedeemable(bool redeemable_) external
```

### setConvertable

```solidity
function setConvertable(bool convertable_) external
```

### withdrawRemoteUnderlyingTokens

```solidity
function withdrawRemoteUnderlyingTokens(bool makeRedeemable_) public
```

_Withdraw cake from cake pool._

### emergencyTransferUnderlyingTokens

```solidity
function emergencyTransferUnderlyingTokens(address to_) external
```

_emergency transfer underlying token for security issue or bug encounted._

### extendBond

```solidity
function extendBond(struct ExtendableBond.CheckPoints checkPoints_) public
```

### addFeeSpec

```solidity
function addFeeSpec(struct ExtendableBond.FeeSpec feeSpec_) external
```

add

### depositToRemote

```solidity
function depositToRemote(uint256 amount_) public
```

### depositAllToRemote

```solidity
function depositAllToRemote() public
```

### removeFeeSpec

```solidity
function removeFeeSpec(uint256 feeSpecIndex) external
```

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

### setAdmin

```solidity
function setAdmin(address _admin) external
```

Set admin address

_Only callable by the contract owner._

