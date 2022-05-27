// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IBondFarmingPool.sol";

contract MockIBondFarmingPool is IBondFarmingPool {
    uint256 public lastUpdatedPoolAt;
    IBondFarmingPool public siblingPool;
    IERC20 public bondToken;
    mapping(address => uint256) public usersAmount;

    constructor(IERC20 bondToken_) {
        bondToken = bondToken_;
    }

    function stake(uint256 amount_) public {
        stakeForUser(msg.sender, amount_);
    }

    function stakeForUser(address user_, uint256 amount_) public {
        bondToken.transferFrom(msg.sender, address(this), amount_);
        usersAmount[user_] += amount_;
    }

    function updatePool() external {
        lastUpdatedPoolAt = block.number;
    }

    function setSiblingPool(IBondFarmingPool siblingPool_) public {
        siblingPool = siblingPool_;
    }

    function totalPendingRewards() external view returns (uint256) {
        return 0;
    }
}
