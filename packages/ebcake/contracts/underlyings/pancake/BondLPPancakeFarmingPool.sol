// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "hardhat/console.sol";

import "../../interfaces/IPancakeMasterChefV2.sol";
import "../../BondLPFarmingPool.sol";

contract BondLPPancakeFarmingPool is BondLPFarmingPool {
    IERC20Upgradeable public cakeToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IPancakeMasterChefV2 public pancakeMasterChef;

    uint256 public pancakeMasterChefPid;

    /**
     * @dev accumulated cake rewards of each lp token.
     */
    uint256 public accPancakeRewardsPerShares;

    struct PancakeUserInfo {
        /**
         * like sushi rewardDebt
         */
        uint256 rewardDebt;
        /**
         * @dev Rewards credited to rewardDebt but not yet claimed
         */
        uint256 pendingRewards;
        /**
         * @dev claimed rewards. for 'earned to date' calculation.
         */
        uint256 claimedRewards;
    }

    mapping(address => PancakeUserInfo) public pancakeUsersInfo;

    function initPancake(
        IERC20Upgradeable cakeToken_,
        IPancakeMasterChefV2 pancakeMasterChef_,
        uint256 pancakeMasterChefPid_
    ) external onlyAdmin {
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
            pancakeUserInfo.pendingRewards += sharesReward - userInfo.rewardDebt;
            pancakeUserInfo.rewardDebt =
                (accPancakeRewardsPerShares * (userInfo.lpAmount + amount_)) /
                ACC_REWARDS_PRECISION;
        } else {
            pancakeUserInfo.rewardDebt = (accPancakeRewardsPerShares * amount_) / ACC_REWARDS_PRECISION;
        }

        if (amount_ > 0) {
            lpToken.safeApprove(address(pancakeMasterChef), amount_);
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
        uint256 pendingRewards = sharesReward + pancakeUserInfo.pendingRewards - userInfo.rewardDebt;
        pancakeUserInfo.pendingRewards = 0;
        pancakeUserInfo.rewardDebt = sharesReward;

        // withdraw from pancake
        pancakeMasterChef.withdraw(pancakeMasterChefPid, amount_);

        // send cake rewards
        cakeToken.safeTransfer(user_, pendingRewards);
        pancakeUserInfo.claimedRewards += pendingRewards;
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
