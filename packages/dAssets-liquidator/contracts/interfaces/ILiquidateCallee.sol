//SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

interface ILiquidateCallee {
    function liquidateDeposit(address borrower, address underlying, uint256 amount, bytes calldata data) external;

    function liquidateBorrow(address borrower, address underlying, uint256 amount, bytes calldata data) external;
}
