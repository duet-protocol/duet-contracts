# Solidity API

## MockERC20

### _decimals

```solidity
uint8 _decimals
```

### constructor

```solidity
constructor(string name, string symbol, uint256 supply, uint8 decimals_) public
```

### mintTokens

```solidity
function mintTokens(uint256 _amount) external
```

### mint

```solidity
function mint(address to_, uint256 _amount) external
```

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5.05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

## MockERC20

### _decimals

```solidity
uint8 _decimals
```

### constructor

```solidity
constructor(string name, string symbol, uint256 supply, uint8 decimals_) public
```

### mintTokens

```solidity
function mintTokens(uint256 _amount) external
```

### mint

```solidity
function mint(address to_, uint256 _amount) external
```

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if &#x60;decimals&#x60; equals &#x60;2&#x60;, a balance of &#x60;505&#x60; tokens should
be displayed to a user as &#x60;5.05&#x60; (&#x60;505 / 10 ** 2&#x60;).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

