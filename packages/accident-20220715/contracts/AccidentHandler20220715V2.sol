// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "@private/shared/libs/Adminable.sol";


contract AccidentHandler20220715V2 is Initializable, Adminable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  // [user]: [token]: amount # retrievable
  mapping(address => mapping(address => uint)) public userRetrievableTokenMap;
  // [user]: [token]: amount # retrieved
  mapping(address => mapping(address => uint)) public userRetrievedTokenMap;
  // [token]: amount # retrievable
  mapping(address => uint) public remainTokenMap;

  event Retrieve(address user, address token, uint amount);
  struct Record {
    address user;
    address token;
    uint amount;
  }

  function initialize(address admin_) public initializer {
    require(admin_ != address(0), "Cant set admin to zero address");
    _setAdmin(admin_);
  }

  function retrievables(address[] calldata tokens) external view returns (uint[] memory) {
    uint[] memory amounts = new uint[](tokens.length);
    for (uint i; i < tokens.length; i++) {
      amounts[i] = userRetrievableTokenMap[msg.sender][tokens[i]];
    }
    return amounts;
  }

  function retrieved(address[] calldata tokens) external view returns (uint[] memory) {
    uint[] memory amounts = new uint[](tokens.length);
    for (uint i; i < tokens.length; i++) {
      amounts[i] = userRetrievedTokenMap[msg.sender][tokens[i]];
    }
    return amounts;
  }

  function setRecords(Record[] calldata records_) external onlyAdmin {
    for (uint i; i < records_.length; i++) {
      Record calldata record = records_[i];
      userRetrievableTokenMap[record.user][record.token] += record.amount;
      remainTokenMap[record.token] += record.amount;
    }
  }

  function retrieveTokens(address[] calldata tokens) external {
    for (uint i; i < tokens.length; i++) {
      IERC20Upgradeable token = IERC20Upgradeable(tokens[i]);
      uint amount = userRetrievableTokenMap[msg.sender][tokens[i]];
      if (amount > 0) {
        delete userRetrievableTokenMap[msg.sender][tokens[i]];
        userRetrievedTokenMap[msg.sender][tokens[i]] += amount;
        remainTokenMap[tokens[i]] -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Retrieve(msg.sender, tokens[i], amount);
      }
    }
  }

}
