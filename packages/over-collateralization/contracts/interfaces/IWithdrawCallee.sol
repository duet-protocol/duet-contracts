//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IWithdrawCallee {
    function execCallback(address sender, address asset, uint256 amount, bytes calldata data) external;
}
