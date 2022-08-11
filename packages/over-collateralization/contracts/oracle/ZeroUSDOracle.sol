//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/IUSDOracle.sol";

contract ZeroUSDOracle is IUSDOracle {
  function getPrice(address token) external view returns (uint256) {
    return 0;
  }
}
