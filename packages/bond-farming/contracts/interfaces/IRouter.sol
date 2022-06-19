pragma solidity >=0.8.0;

interface IRouter {
  function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}