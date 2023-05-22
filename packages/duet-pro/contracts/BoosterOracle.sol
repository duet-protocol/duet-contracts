// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IUniswapV3Pool.sol";
import "./interfaces/IUniswapV3Factory.sol";

contract BoosterOracle {
    address private constant FACTORY_ADDRESS = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // Uniswap V3 Factory address on the Arbitrum network
    address private constant USDC_ADDRESS = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8; // USDC address on the Arbitrum network

    uint24 public constant FEE = 10000;

    function getPrice(address token0) public view returns (uint256) {
        IUniswapV3Factory factory = IUniswapV3Factory(FACTORY_ADDRESS);
        address poolAddress = factory.getPool(token0, USDC_ADDRESS, FEE);

        IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);

        (uint160 sqrtPrice, , , , , , ) = pool.slot0();

        uint256 price = (uint256(sqrtPrice) ** 2 * (10 ** 20)) / (2 ** (96 * 2));

        return price;
    }
}