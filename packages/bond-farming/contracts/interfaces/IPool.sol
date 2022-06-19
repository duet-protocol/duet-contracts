pragma solidity >=0.8.0;

interface IPool {
    function getEpoches() external view returns(address[] memory);
    function totalAmount() external view returns (uint);
    // function epoches(uint256 id) external view returns(address);
    function epochInfos(address) external view returns (uint256, uint256);
    function pending(address user) external view returns (address[] memory epochs, uint256[] memory rewards);
}