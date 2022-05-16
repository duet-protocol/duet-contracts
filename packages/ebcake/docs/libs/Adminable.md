# Solidity API

## Adminable

### AdminUpdated

```solidity
event AdminUpdated(address user, address newAdmin)
```

### admin

```solidity
address admin
```

### onlyAdmin

```solidity
modifier onlyAdmin()
```

### setAdmin

```solidity
function setAdmin(address newAdmin) public virtual
```

### _setAdmin

```solidity
function _setAdmin(address newAdmin) internal
```

