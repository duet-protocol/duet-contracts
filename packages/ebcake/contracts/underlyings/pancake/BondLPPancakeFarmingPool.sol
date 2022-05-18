// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "../../interfaces/IPancakeMasterChefV2.sol";
import "../../BondLPFarmingPool.sol";

contract BondLPPancakeFarmingPool is BondLPFarmingPool {
    using SafeERC20 for IERC20;

    IERC20 public cakeToken;
    IPancakeMasterChefV2 pancakeMasterChef;

    uint256 pancakeMasterChefPid;

    /**
     * @dev accumulated cake rewards of each lp token.
     */
    uint256 accPancakeRewardsPerShares;

    struct PancakeUserInfo {
        /**
         * like sushi rewardDebit
         */
        uint256 rewardDebit;
        /**
         * @dev Rewards credited to rewardDebit but not yet claimed
         */
        uint256 pendingRewards;
    }

    mapping(address => PancakeUserInfo) public pancakeUsersInfo;

    constructor(IERC20 bondToken_, IExtendableBond bond_) BondLPFarmingPool(bondToken_, bond_) {}

    function initPancake(
        IERC20 cakeToken_,
        IPancakeMasterChefV2 pancakeMasterChef_,
        uint256 pancakeMasterChefPid_
    ) external onlyOwner {
        require(
            address(pancakeMasterChef_) != address(0) &&
                pancakeMasterChefPid_ != 0 &&
                address(cakeToken_) != address(0),
            "Invalid inputs"
        );
        require(
            address(pancakeMasterChef) == address(0) && pancakeMasterChefPid == 0,
            "can not modify pancakeMasterChef"
        );
        cakeToken = cakeToken_;
        pancakeMasterChef = pancakeMasterChef_;
        pancakeMasterChefPid = pancakeMasterChefPid_;
    }

    function _requirePancakeSettled() internal view {
        require(
            address(pancakeMasterChef) != address(0) && pancakeMasterChefPid != 0 && address(cakeToken) != address(0),
            "Pancake not settled"
        );
    }

    /**
     * @dev stake to pancakeswap
     * @param user_ user to stake
     * @param amount_ amount to stake
     */
    function _stakeRemote(address user_, uint256 amount_) internal override {
        _requirePancakeSettled();
        UserInfo storage userInfo = usersInfo[user_];
        PancakeUserInfo storage pancakeUserInfo = pancakeUsersInfo[user_];

        if (userInfo.lpAmount > 0) {
            uint256 sharesReward = (accPancakeRewardsPerShares * userInfo.lpAmount) / ACC_REWARDS_PRECISION;
            pancakeUserInfo.pendingRewards += sharesReward - userInfo.rewardDebit;
            pancakeUserInfo.rewardDebit = sharesReward;
        }

        if (amount_ > 0) {
            cakeToken.safeApprove(address(pancakeMasterChef), amount_);
            // deposit to pancake
            pancakeMasterChef.deposit(pancakeMasterChefPid, amount_);
        }
    }

    /**
     * @dev unstake from pancakeswap
     * @param user_ user to unstake
     * @param amount_ amount to unstake
     */
    function _unstakeRemote(address user_, uint256 amount_) internal override {
        _requirePancakeSettled();
        UserInfo storage userInfo = usersInfo[user_];
        PancakeUserInfo storage pancakeUserInfo = pancakeUsersInfo[user_];

        uint256 sharesReward = (accRewardPerShare * userInfo.lpAmount) / ACC_REWARDS_PRECISION;
        uint256 pendingRewards = sharesReward + pancakeUserInfo.pendingRewards - userInfo.rewardDebit;
        pancakeUserInfo.pendingRewards = 0;
        pancakeUserInfo.rewardDebit = sharesReward;

        // withdraw from pancake
        pancakeMasterChef.withdraw(pancakeMasterChefPid, amount_);

        // send cake rewards
        cakeToken.safeTransfer(user_, pendingRewards);
    }

    /**
     * @dev harvest from pancakeswap
     */
    function _harvestRemote() internal override {
        _requirePancakeSettled();

        uint256 previousCakeAmount = cakeToken.balanceOf(address(this));
        pancakeMasterChef.deposit(pancakeMasterChefPid, 0);
        uint256 afterCakeAmount = cakeToken.balanceOf(address(this));
        uint256 newRewards = afterCakeAmount - previousCakeAmount;
        if (newRewards > 0) {
            accPancakeRewardsPerShares += (newRewards * ACC_REWARDS_PRECISION) / totalLpAmount;
        }
    }
}
