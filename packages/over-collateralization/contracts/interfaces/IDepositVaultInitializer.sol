// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IDepositVaultInitializer {
    function initialize(
        address _controller,
        address _feeConf,
        address _underlying
    ) external;

    function transferOwnership(address newOwner) external;
}
