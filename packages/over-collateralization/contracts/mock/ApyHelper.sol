//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/IMasterChef.sol";
import "../interfaces/IUSDOracle.sol";
import "../interfaces/IPair.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ApyHelper {
    IMasterChef public masterChef;
    IUSDOracle public usdOracle;
    address public cake;

    constructor(
        IMasterChef _chef,
        IUSDOracle _usdOracle,
        address _cake
    ) {
        masterChef = _chef;
        usdOracle = _usdOracle;
        cake = _cake;
    }

    function lpPrice(address lpToken) public view returns (uint256 price) {
        uint256 lpSupply = IERC20(lpToken).totalSupply();
        address token0 = IPair(lpToken).token0();
        address token1 = IPair(lpToken).token1();
        (uint112 reserve0, uint112 reserve1, ) = IPair(lpToken).getReserves();
        uint256 amount0 = (uint256(reserve0) * 10**18) / lpSupply;
        uint256 amount1 = (uint256(reserve1) * 10**18) / lpSupply;

        uint256 price0 = usdOracle.getPrice(token0);
        uint256 price1 = usdOracle.getPrice(token1);

        uint256 decimal0 = IERC20Metadata(token0).decimals();
        uint256 decimal0Scale = 10**decimal0;

        uint256 decimal1 = IERC20Metadata(token1).decimals();
        uint256 decimal1Scale = 10**decimal1;

        return ((amount0 * price0) / decimal0Scale) + ((amount1 * price1) / decimal1Scale);
    }

    function lpApyInfo(uint256 pid)
        public
        view
        returns (
            uint256 takingTokenPrice,
            uint256 rewardTokenPrice,
            uint256 totalStaked,
            uint256 tokenPerBlock
        )
    {
        (address lpToken, uint256 allocPoint, , ) = masterChef.poolInfo(pid);

        takingTokenPrice = lpPrice(lpToken);

        rewardTokenPrice = usdOracle.getPrice(cake);

        totalStaked = IERC20(lpToken).balanceOf(address(masterChef));
        uint256 cakeTotal = masterChef.cakePerBlock();
        uint256 totalAlloc = masterChef.totalAllocPoint();

        tokenPerBlock = (allocPoint * cakeTotal) / totalAlloc;
    }
}
