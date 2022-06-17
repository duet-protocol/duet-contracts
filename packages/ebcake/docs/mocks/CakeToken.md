# Solidity API

## CakeToken

### mint

```solidity
function mint(address _to, uint256 _amount) public
```

_Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef)._

### _delegates

```solidity
mapping(address => address) _delegates
```

_A record of each accounts delegate_

### Checkpoint

```solidity
struct Checkpoint {
  uint32 fromBlock;
  uint256 votes;
}
```

### checkpoints

```solidity
mapping(address => mapping(uint32 => struct CakeToken.Checkpoint)) checkpoints
```

_A record of votes checkpoints for each account, by index_

### numCheckpoints

```solidity
mapping(address => uint32) numCheckpoints
```

_The number of checkpoints for each account_

### DOMAIN_TYPEHASH

```solidity
bytes32 DOMAIN_TYPEHASH
```

_The EIP-712 typehash for the contract's domain_

### DELEGATION_TYPEHASH

```solidity
bytes32 DELEGATION_TYPEHASH
```

_The EIP-712 typehash for the delegation struct used by the contract_

### nonces

```solidity
mapping(address => uint256) nonces
```

_A record of states for signing / validating signatures_

### DelegateChanged

```solidity
event DelegateChanged(address delegator, address fromDelegate, address toDelegate)
```

_An event thats emitted when an account changes its delegate_

### DelegateVotesChanged

```solidity
event DelegateVotesChanged(address delegate, uint256 previousBalance, uint256 newBalance)
```

_An event thats emitted when a delegate account's vote balance changes_

### delegates

```solidity
function delegates(address delegator) external view returns (address)
```

_Delegate votes from `msg.sender` to `delegatee`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegator | address | The address to get delegatee for |

### delegate

```solidity
function delegate(address delegatee) external
```

_Delegate votes from `msg.sender` to `delegatee`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | The address to delegate votes to |

### delegateBySig

```solidity
function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external
```

_Delegates votes from signatory to `delegatee`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| delegatee | address | The address to delegate votes to |
| nonce | uint256 | The contract state required to match the signature |
| expiry | uint256 | The time at which to expire the signature |
| v | uint8 | The recovery byte of the signature |
| r | bytes32 | Half of the ECDSA signature pair |
| s | bytes32 | Half of the ECDSA signature pair |

### getCurrentVotes

```solidity
function getCurrentVotes(address account) external view returns (uint256)
```

_Gets the current votes balance for `account`_

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address to get votes balance |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of current votes for `account` |

### getPriorVotes

```solidity
function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256)
```

_Determine the prior number of votes for an account as of a block number
Block number must be a finalized block or else this function will revert to prevent misinformation._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address of the account to check |
| blockNumber | uint256 | The block number to get the vote balance at |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of votes the account had as of the given block |

### _delegate

```solidity
function _delegate(address delegator, address delegatee) internal
```

### _moveDelegates

```solidity
function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal
```

### _writeCheckpoint

```solidity
function _writeCheckpoint(address delegatee, uint32 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal
```

### safe32

```solidity
function safe32(uint256 n, string errorMessage) internal pure returns (uint32)
```

### getChainId

```solidity
function getChainId() internal view returns (uint256)
```

