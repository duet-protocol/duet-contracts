// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IVault {
    // call from controller must impl.
    function underlying() external view returns (address);

    function isDuetVault() external view returns (bool);

    function liquidate(address liquidator, address borrower, bytes calldata data) external;

    function userValue(address user, bool dp) external view returns (uint256);

    function pendingValue(address user, int256 pending) external view returns (uint256);

    function underlyingAmountValue(uint256 amount, bool dp) external view returns (uint256 value);
}
