// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "hardhat/console.sol";

import "./ExtendableBond.sol";
import "./libs/DuetMath.sol";
import "./MultiRewardsMasterChef.sol";
import "./interfaces/IBondFarmingPool.sol";
import "./interfaces/IExtendableBond.sol";

contract BondLPFarmingPool is Pausable, ReentrancyGuard, Ownable, IBondFarmingPool {
    using SafeERC20 for IERC20;
    IERC20 public bondToken;
    IERC20 public lpToken;
    IExtendableBond public bond;

    IBondFarmingPool public siblingPool;
    uint256 public lastUpdatedPoolAt = 0;

    MultiRewardsMasterChef masterChef;

    uint256 masterChefPid;

    uint256 accRewardPerShare;

    uint256 ACC_REWARDS_PRECISION = 1e12;

    /**
     * @notice mark bond reward is suspended. If the LP Token needs to be migrated, such as from pancake to ESP, the bond rewards will be suspended.
     * @notice you can not stake anymore when bond rewards has been suspended.
     * @dev _updatePools() no longer works after bondRewardsSuspended is true.
     */
    bool public bondRewardsSuspended = false;

    struct UserInfo {
        /**
         * @dev described compounded lp token amount, user's shares / total shares * underlying amount = user's amount.
         */
        uint256 shares;
        /**
         * lp amount deposited by user.
         */
        uint256 lpAmount;
        /**
         * like sushi rewardDebit
         */
        uint256 rewardDebit;
        /**
         * @dev Rewards credited to rewardDebit but not yet claimed
         */
        uint256 pendingRewards;
    }

    mapping(address => UserInfo) public usersInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(IERC20 bondToken_, IExtendableBond bond_) {
        bondToken = bondToken_;
        bond = bond_;
    }

    function setLpToken(IERC20 lpToken_) public onlyOwner {
        require(address(lpToken) == address(0), "Can not modify lpToken");
        lpToken = lpToken_;
    }

    function setMasterChef(MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public onlyOwner {
        masterChef = masterChef_;
        masterChefPid = masterChefPid_;
    }

    /**
     * @dev see: _updatePool
     */
    function updatePool() external {
        require(
            msg.sender == address(siblingPool) || msg.sender == address(bond),
            "BondLPFarmingPool: Calling from sibling pool or bond only"
        );
        _updatePool();
    }

    /**
     * @dev allocate pending rewards.
     */
    function _updatePool() internal {
        require(
            siblingPool.lastUpdatedPoolAt() > lastUpdatedPoolAt ||
                (siblingPool.lastUpdatedPoolAt() == lastUpdatedPoolAt && lastUpdatedPoolAt == block.number),
            "update bond pool firstly."
        );
        uint256 pendingRewards = totalPendingRewards();
        lastUpdatedPoolAt = block.number;
        if (pendingRewards <= 0) {
            return;
        }
        uint256 totalLpAmount = lpToken.balanceOf(address(this));
        if (totalLpAmount > 0) {
            accRewardPerShare += pendingRewards / (lpToken.balanceOf(address(this)) / ACC_REWARDS_PRECISION);
        } else {
            accRewardPerShare = 0;
        }
        bond.mintBondTokenForRewards(address(this), pendingRewards);
    }

    /**
     * @dev distribute single bond pool first, then LP pool will get the remaining rewards. see _updatePools
     */
    function totalPendingRewards() public view virtual returns (uint256) {
        if (bondRewardsSuspended) {
            return 0;
        }
        uint256 totalBondPendingRewards = bond.totalPendingRewards();
        if (totalBondPendingRewards <= 0) {
            return 0;
        }
        return totalBondPendingRewards;
    }

    function setSiblingPool(IBondFarmingPool siblingPool_) public onlyOwner {
        require(
            (address(siblingPool_.siblingPool()) == address(0) ||
                address(siblingPool_.siblingPool()) == address(this)) && (address(siblingPool_) != address(this)),
            "Invalid sibling"
        );
        siblingPool = siblingPool_;
    }

    function stake(uint256 amount_) public whenNotPaused {
        require(!bondRewardsSuspended, "Reward suspended. Please follow the project announcement ");
        address user = msg.sender;
        stakeForUser(user, amount_);
    }

    function _updatePools() internal {
        if (bondRewardsSuspended) {
            return;
        }
        siblingPool.updatePool();
        _updatePool();
    }

    function stakeForUser(address user_, uint256 amount_) public whenNotPaused nonReentrant {
        require(amount_ > 0, "nothing to stake");
        // allocate pending rewards of all sibling pools to correct reward ratio between them.
        _updatePools();
        UserInfo storage userInfo = usersInfo[user_];
        if (userInfo.lpAmount > 0) {
            uint256 sharesReward = accRewardPerShare * (userInfo.lpAmount / ACC_REWARDS_PRECISION);
            userInfo.pendingRewards += sharesReward - userInfo.rewardDebit;
            userInfo.rewardDebit = sharesReward;
        }
        lpToken.transferFrom(msg.sender, address(this), amount_);
        userInfo.lpAmount += amount_;
        masterChef.depositForUser(masterChefPid, amount_, user_);
        emit Staked(user_, amount_);
    }

    /**
     * @notice unstake by shares
     */
    function unstake(uint256 amount_) public whenNotPaused nonReentrant {
        address user = msg.sender;
        UserInfo storage userInfo = usersInfo[user];
        require(userInfo.lpAmount >= amount_ && userInfo.lpAmount > 0, "unstake amount exceeds owned amount");

        // allocate pending rewards of all sibling pools to correct reward ratio between them.
        _updatePools();

        uint256 sharesReward = accRewardPerShare * (userInfo.lpAmount / ACC_REWARDS_PRECISION);
        console.log("BondLPFarmingPool.sharesReward", sharesReward);
        uint256 pendingRewards = userInfo.pendingRewards + sharesReward - userInfo.rewardDebit;
        userInfo.rewardDebit = sharesReward;
        userInfo.pendingRewards = 0;

        if (amount_ > 0) {
            userInfo.lpAmount -= amount_;
            // send staked assets
            lpToken.safeTransfer(user, amount_);
        }

        // send rewards
        bondToken.transfer(user, pendingRewards);
        masterChef.withdrawForUser(masterChefPid, amount_, user);

        emit Unstaked(user, amount_);
    }

    function unstakeAll() public {
        require(usersInfo[msg.sender].lpAmount > 0, "nothing to unstake");
        unstake(usersInfo[msg.sender].lpAmount);
    }

    function setBondRewardsSuspended(bool suspended_) public onlyOwner {
        _updatePools();
        bondRewardsSuspended = suspended_;
    }

    function claimBonuses() public {
        unstake(0);
    }
}
