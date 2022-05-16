# Solidity API

## DuetMath

### Rounding

```solidity
enum Rounding {
  Down,
  Up,
  Zero
}
```

### mulDiv

```solidity
function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result)
```

Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator &#x3D;&#x3D; 0

_Credit to Remco Bloemen under MIT license https://xn--2-umb.com/21/muldiv_

### mulDiv

```solidity
function mulDiv(uint256 x, uint256 y, uint256 denominator, enum DuetMath.Rounding direction) public pure returns (uint256)
```

Calculates x * y / denominator with full precision, following the selected rounding direction.

