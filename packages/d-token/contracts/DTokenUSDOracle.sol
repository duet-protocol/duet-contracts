//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@private/shared/3rd/chainlink/AggregatorV3Interface.sol";

import "./interfaces/IUSDOracle.sol";

contract DTokenUSDOracle is Ownable, IUSDOracle {

  mapping(address => AggregatorV3Interface) public aggregators;
  event SetAggregator(address indexed token, AggregatorV3Interface indexed aggregator);

  function setAggregator(address token, AggregatorV3Interface aggregator) external onlyOwner {
    uint8 dec = aggregator.decimals();
    require(dec == 8, "not support decimals");
    aggregators[token] = aggregator;
    emit SetAggregator(token, aggregator);
  }

  // get latest price
  function getPrice(address token) external override view returns (uint256) {
    (, int256 price, , , ) = aggregators[token].latestRoundData();
    require(price >= 0, "Negative Price!");
    return uint256(price);
  }

}
