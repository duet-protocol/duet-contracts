# Solidity API

## BEP20

_Implementation of the {IBEP20} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.
For a generic mechanism see {BEP20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-BEP20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin guidelines: functions revert instead
of returning `false` on failure. This behavior is nonetheless conventional
and does not conflict with the expectations of BEP20 applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts just
by listening to said events. Other implementations of the EIP may not emit
these events, as it isn't required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around setting
allowances. See {IBEP20-approve}._

### _balances

```solidity
mapping(address => uint256) _balances
```

### _allowances

```solidity
mapping(address => mapping(address => uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### _decimals

```solidity
uint8 _decimals
```

### constructor

```solidity
constructor(string name, string symbol) public
```

_Sets the values for {name} and {symbol}, initializes {decimals} with
a default value of 18.

To select a different value for {decimals}, use {_setupDecimals}.

All three of these values are immutable: they can only be set once during
construction._

### getOwner

```solidity
function getOwner() external view returns (address)
```

_Returns the bep token owner._

### name

```solidity
function name() public view returns (string)
```

_Returns the token name._

### decimals

```solidity
function decimals() public view returns (uint8)
```

_Returns the token decimals._

### symbol

```solidity
function symbol() public view returns (string)
```

_Returns the token symbol._

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_See {BEP20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view returns (uint256)
```

_See {BEP20-balanceOf}._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public returns (bool)
```

_See {BEP20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### allowance

```solidity
function allowance(address owner, address spender) public view returns (uint256)
```

_See {BEP20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public returns (bool)
```

_See {BEP20-approve}.

Requirements:

- `spender` cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)
```

_See {BEP20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {BEP20};

Requirements:
- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for `sender`'s tokens of at least
`amount`._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {BEP20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {BEP20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### mint

```solidity
function mint(uint256 amount) public returns (bool)
```

_Creates `amount` tokens and assigns them to `msg.sender`, increasing
the total supply.

Requirements

- `msg.sender` must be the token owner_

### _transfer

```solidity
function _transfer(address sender, address recipient, uint256 amount) internal
```

_Moves tokens `amount` from `sender` to `recipient`.

This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`._

### _mint

```solidity
function _mint(address account, uint256 amount) internal
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements

- `to` cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal
```

_Sets `amount` as the allowance of `spender` over the `owner`s tokens.

This is internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address._

### _burnFrom

```solidity
function _burnFrom(address account, uint256 amount) internal
```

_Destroys `amount` tokens from `account`.`amount` is then deducted
from the caller's allowance.

See {_burn} and {_approve}._

