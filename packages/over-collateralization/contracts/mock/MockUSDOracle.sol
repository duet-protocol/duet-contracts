//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IUSDOracle.sol";

contract MockUSDOracle is Ownable, IUSDOracle {
    mapping(address => uint256) prices;

    function setPrice(address _token, uint256 _price) external {
        prices[_token] = _price;
    }

    // get latest price
    function getPrice(address token) external view override returns (uint256) {
        return prices[token];
    }
}
