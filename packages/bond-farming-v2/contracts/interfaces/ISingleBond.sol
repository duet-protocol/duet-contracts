// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISingleBond {
    function mint(address to_, uint256 amount_) external;

    function redeem(address to_, uint256 amount_) external;
}
