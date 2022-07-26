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

  constructor(IMasterChef _chef, IUSDOracle _usdOracle, address _cake) {
    masterChef = _chef;
    usdOracle = _usdOracle;
    cake = _cake;
  }

  function lpPrice(address lpToken) public view returns (uint price) {
      uint lpSupply = IERC20(lpToken).totalSupply();
      address token0 = IPair(lpToken).token0();
      address token1 = IPair(lpToken).token1();
      (uint112 reserve0, uint112 reserve1, ) = IPair(lpToken).getReserves();
      uint amount0 = uint(reserve0) * 10**18 / lpSupply;
      uint amount1 = uint(reserve1) * 10**18 / lpSupply;

      uint price0 = usdOracle.getPrice(token0);
      uint price1 = usdOracle.getPrice(token1);

      uint decimal0 = IERC20Metadata(token0).decimals();
      uint decimal0Scale = 10 ** decimal0;

      uint decimal1 = IERC20Metadata(token1).decimals();
      uint decimal1Scale = 10 ** decimal1;

      return (amount0 * price0 / decimal0Scale) + (amount1 * price1 / decimal1Scale);
  }

  function lpApyInfo(uint pid) public view returns (
      uint takingTokenPrice,
      uint rewardTokenPrice,
      uint totalStaked, 
      uint tokenPerBlock) {
    (address lpToken, uint256 allocPoint, ,) = masterChef.poolInfo(pid);

    takingTokenPrice = lpPrice(lpToken);
    
    rewardTokenPrice = usdOracle.getPrice(cake);

    totalStaked = IERC20(lpToken).balanceOf(address(masterChef));
    uint cakeTotal = masterChef.cakePerBlock();
    uint totalAlloc = masterChef.totalAllocPoint();

    tokenPerBlock = allocPoint * cakeTotal / totalAlloc;
  }

}
