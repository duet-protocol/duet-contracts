// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../MintVault.sol";

contract MockMintVaultB is MintVault {

  function version() external view returns(string memory version) {
    version = "B";
  }

}
