// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IDusdMinter {
    function dusd() external view returns (address);

    function stableToken() external view returns (address);

    function mineDusd(uint256 amount, uint256 minDusd, address to) external returns (uint256 amountOut);

    function calcInputFee(uint256 amountOut) external view returns (uint256 amountIn, uint256 fee);

    function calcOutputFee(uint256 amountIn) external view returns (uint256 amountOut, uint256 fee);
}
