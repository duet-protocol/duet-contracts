// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../libs/DuetMath.sol";

contract DuetMathMock {
    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator,
        DuetMath.Rounding direction
    ) public pure returns (uint256) {
        return DuetMath.mulDiv(a, b, denominator, direction);
    }
}
