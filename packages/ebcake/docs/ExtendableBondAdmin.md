# Solidity API

## ExtendableBondAdmin

### groups

```solidity
string[] groups
```

### groupedExtendableBonds

```solidity
mapping(string => address[]) groupedExtendableBonds
```

### constructor

```solidity
constructor(address admin_) public
```

### groupNames

```solidity
function groupNames() external view returns (string[])
```

### groupedAddresses

```solidity
function groupedAddresses(string groupName_) external view returns (address[])
```

### createGroup

```solidity
function createGroup(string groupName_) external
```

### destroyGroup

```solidity
function destroyGroup(string groupName_) external
```

### appendGroupItem

```solidity
function appendGroupItem(string groupName_, address itemAddress_) external
```

### removeGroupItem

```solidity
function removeGroupItem(string groupName_, address itemAddress_) external
```

### onlyGroupNameRegistered

```solidity
modifier onlyGroupNameRegistered(string groupName_)
```

