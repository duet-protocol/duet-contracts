//SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

interface IDYToken {
    function deposit(uint256 _amount, address _toVault) external;

    function depositTo(address _to, uint256 _amount, address _toVault) external;

    function depositCoin(address to, address _toVault) external payable;

    function withdraw(address _to, uint256 _shares, bool needWETH) external;

    function underlyingTotal() external view returns (uint256);

    function underlying() external view returns (address);

    function balanceOfUnderlying(address _user) external view returns (uint256);

    function underlyingAmount(uint256 amount) external view returns (uint256);
}
