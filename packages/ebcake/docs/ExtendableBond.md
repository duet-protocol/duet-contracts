# Solidity API

## ExtendableBond

### bondToken

```solidity
contract IBondTokenUpgradeable bondToken
```

Bond token contract

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
function initialize(contract IBondTokenUpgradeable bondToken_, contract IERC20Upgradeable underlyingToken_, address admin_) public
```

### feeSpecsLength

```solidity
function feeSpecsLength() public view returns (uint256)
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

total underlying token amount, including hold in current contract and remote

### totalPendingRewards

```solidity
function totalPendingRewards() public view returns (uint256)
```

_Total pending rewards for bond. May be negative in some unexpected circumstances,
     such as remote underlying amount has unexpectedly decreased makes bond token over issued._

### calculateFeeAmount

```solidity
function calculateFeeAmount(uint256 amount_) public view returns (uint256)
```

### mintBondTokenForRewards

```solidity
function mintBondTokenForRewards(address to_, uint256 amount_) public returns (uint256 totalFeeAmount)
```

_mint bond token for rewards and allocate fees._

### totalBondTokenAmount

```solidity
function totalBondTokenAmount() public view returns (uint256)
```

Bond token total amount.

### remoteUnderlyingAmount

```solidity
function remoteUnderlyingAmount() public view virtual returns (uint256)
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

### _withdrawFromRemote

```solidity
function _withdrawFromRemote(uint256 amount_) internal virtual
```

### convert

```solidity
function convert(uint256 amount_) external
```

_convert underlying token to bond token to current user_

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount_ | uint256 | amount of underlying token to convert |

### requireConvertable

```solidity
function requireConvertable() internal view
```

### _updateFarmingPools

```solidity
function _updateFarmingPools() internal
```

_distribute pending rewards._

### setFarmingPools

```solidity
function setFarmingPools(contract IBondFarmingPool bondPool_, contract IBondFarmingPool lpPool_) public
```

### convertAndStake

```solidity
function convertAndStake(uint256 amount_) external
```

_convert underlying token to bond token and stake to bondFarmingPool for current user_

### _depositRemote

```solidity
function _depositRemote(uint256 amount_) internal virtual
```

### _convertOperation

```solidity
function _convertOperation(uint256 amount_, address user_) internal
```

_convert underlying token to bond token to specific user_

### updateCheckPoints

```solidity
function updateCheckPoints(struct ExtendableBond.CheckPoints checkPoints_) public
```

_update checkPoints_

| Name | Type | Description |
| ---- | ---- | ----------- |
| checkPoints_ | struct ExtendableBond.CheckPoints | new checkpoints |

### setRedeemable

```solidity
function setRedeemable(bool redeemable_) external
```

### setConvertable

```solidity
function setConvertable(bool convertable_) external
```

### emergencyTransferUnderlyingTokens

```solidity
function emergencyTransferUnderlyingTokens(address to_) external
```

_emergency transfer underlying token for security issue or bug encounted._

### addFeeSpec

```solidity
function addFeeSpec(struct ExtendableBond.FeeSpec feeSpec_) external
```

add fee specification

### setFeeSpec

```solidity
function setFeeSpec(uint256 feeId_, struct ExtendableBond.FeeSpec feeSpec_) external
```

update fee specification

### removeFeeSpec

```solidity
function removeFeeSpec(uint256 feeSpecIndex) external
```

### depositToRemote

```solidity
function depositToRemote(uint256 amount_) public
```

### depositAllToRemote

```solidity
function depositAllToRemote() public
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

### burnBondToken

```solidity
function burnBondToken(uint256 amount_) public
```

