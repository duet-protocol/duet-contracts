// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./BEP20.sol";

contract MockBEP20 is BEP20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply
    ) BEP20(name, symbol) {
        _mint(msg.sender, supply);
    }

    function mintTokens(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }

    function mint(address to_, uint256 _amount) external {
        _mint(to_, _amount);
    }
}
