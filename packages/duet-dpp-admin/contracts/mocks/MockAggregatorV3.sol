// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../lib/Adminable.sol";

import "../chainlink/AggregatorV3Interface.sol";

contract MockAggregatorV3 is AggregatorV3Interface, Adminable, Initializable {
    int256 price;

    function initialize(address admin_) external initializer {
        _setAdmin(admin_);
    }

    function setPrice(uint256 newPrice_) external onlyAdmin {
        price = int256(newPrice_);
    }

    function decimals() external view override returns (uint8 decimal) {
        return 8;
    }

    function description() external view override returns (string memory) {
        return "mock aggregator";
    }

    function version() external view override returns (uint256) {
        return 1;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (10, price, 10, 10, 10);
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (10, price, 10, 20, 20);
    }
}
