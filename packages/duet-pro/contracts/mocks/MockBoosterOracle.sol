// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBoosterOracle } from "../interfaces/IBoosterOracle.sol";

contract MockBoosterOracle is IBoosterOracle, Ownable {
    uint256 public price = 1e8;

    constructor() Ownable() {}

    function setPrice(uint256 price_) external onlyOwner {
        price = price_;
    }

    function getPrice(address token) external view returns (uint256) {
        return price;
    }
}
