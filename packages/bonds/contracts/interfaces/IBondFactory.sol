// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IBondFactory {
    function priceFactor() external view returns (uint256);

    function getPrice(address bondToken_) external view returns (uint256 price);
}
