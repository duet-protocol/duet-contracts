// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "@private/shared/libs/Adminable.sol";


contract AccidentHandler20220715 is Initializable, Adminable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  // [user]: [token]: amount
  mapping(address => mapping(address => uint)) public userTokenMap;
  // [token]: amount
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

  function setRecords(Record[] calldata records_) external onlyAdmin {
    for (uint i; i < records_.length; i++) {
      Record calldata record = records_[i];
      userTokenMap[record.user][record.token] += record.amount;
      remainTokenMap[record.token] += record.amount;
    }
  }

  function retrieveTokens(address[] calldata tokens) external {
    for (uint i; i < tokens.length; i++) {
      IERC20Upgradeable token = IERC20Upgradeable(tokens[i]);
      uint amount = userTokenMap[msg.sender][tokens[i]];
      if (amount > 0) {
        delete userTokenMap[msg.sender][tokens[i]];
        remainTokenMap[tokens[i]] -= amount;
        token.safeTransfer(msg.sender, amount);
        emit Retrieve(msg.sender, tokens[i], amount);
      }
    }
  }

}
