// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "hardhat/console.sol";

import "./ExtendableBond.sol";
import "./libs/DuetMath.sol";
import "./libs/Adminable.sol";
import "./MultiRewardsMasterChef.sol";
import "./interfaces/IBondFarmingPool.sol";
import "./interfaces/IExtendableBond.sol";

contract BondLPFarmingPool is ReentrancyGuardUpgradeable, PausableUpgradeable, Adminable, IBondFarmingPool {
    IERC20Upgradeable public bondToken;
    IERC20Upgradeable public lpToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    IExtendableBond public bond;

    IBondFarmingPool public siblingPool;
    uint256 public lastUpdatedPoolAt = 0;

    MultiRewardsMasterChef public masterChef;

    uint256 public masterChefPid;

    /**
     * @dev accumulated bond token rewards of each lp token.
     */
    uint256 public accRewardPerShare;

    uint256 public constant ACC_REWARDS_PRECISION = 1e12;

    uint256 public totalLpAmount;
    /**
     * @notice mark bond reward is suspended. If the LP Token needs to be migrated, such as from pancake to ESP, the bond rewards will be suspended.
     * @notice you can not stake anymore when bond rewards has been suspended.
     * @dev _updatePools() no longer works after bondRewardsSuspended is true.
     */
    bool public bondRewardsSuspended = false;

    struct UserInfo {
        /**
         * @dev lp amount deposited by user.
         */
        uint256 lpAmount;
        /**
         * @dev like sushi rewardDebit
         */
        uint256 rewardDebit;
        /**
         * @dev Rewards credited to rewardDebit but not yet claimed
         */
        uint256 pendingRewards;
        /**
         * @dev claimed rewards. for 'earned to date' calculation.
         */
        uint256 claimedRewards;
    }

    mapping(address => UserInfo) public usersInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event SiblingPoolUpdated(address indexed previousPool, address indexed newPool);

    function initialize(
        IERC20Upgradeable bondToken_,
        IExtendableBond bond_,
        address admin_
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        _setAdmin(admin_);
        bondToken = bondToken_;
        bond = bond_;
    }

    function setLpToken(IERC20Upgradeable lpToken_) public onlyAdmin {
        lpToken = lpToken_;
    }

    function setMasterChef(MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public onlyAdmin {
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
        // Single bond token farming rewards base on  'bond token mount in pool' / 'total bond token supply' * 'total underlying rewards' and remaining rewards for LP pools.
        // So single bond farming pool should be updated before LP's.
        require(
            siblingPool.lastUpdatedPoolAt() > lastUpdatedPoolAt ||
                (siblingPool.lastUpdatedPoolAt() == lastUpdatedPoolAt && lastUpdatedPoolAt == block.number),
            "update bond pool firstly."
        );
        uint256 pendingRewards = totalPendingRewards();
        lastUpdatedPoolAt = block.number;
        _harvestRemote();
        if (pendingRewards <= 0) {
            return;
        }
        if (totalLpAmount > 0) {
            accRewardPerShare += (pendingRewards * ACC_REWARDS_PRECISION) / totalLpAmount;
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
        return totalBondPendingRewards - siblingPool.totalPendingRewards();
    }

    /**
     * @dev get pending rewards by specific user
     */
    function getUserPendingRewards(address user_) public view virtual returns (uint256) {
        UserInfo storage userInfo = usersInfo[user_];

        uint256 latestAccRewardPerShare = (totalPendingRewards() * ACC_REWARDS_PRECISION) /
            totalLpAmount +
            accRewardPerShare;
        return
            (latestAccRewardPerShare * userInfo.lpAmount) /
            ACC_REWARDS_PRECISION +
            userInfo.pendingRewards -
            userInfo.rewardDebit;
    }

    function setSiblingPool(IBondFarmingPool siblingPool_) public onlyAdmin {
        require(
            (address(siblingPool_.siblingPool()) == address(0) ||
                address(siblingPool_.siblingPool()) == address(this)) && (address(siblingPool_) != address(this)),
            "Invalid sibling"
        );
        emit SiblingPoolUpdated(address(siblingPool), address(siblingPool_));
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

    function _stakeRemote(address user_, uint256 amount_) internal virtual {}

    function _unstakeRemote(address user_, uint256 amount_) internal virtual {}

    function _harvestRemote() internal virtual {}

    function stakeForUser(address user_, uint256 amount_) public whenNotPaused nonReentrant {
        require(amount_ > 0, "nothing to stake");
        // allocate pending rewards of all sibling pools to correct reward ratio between them.
        _updatePools();
        UserInfo storage userInfo = usersInfo[user_];
        if (userInfo.lpAmount > 0) {
            uint256 sharesReward = (accRewardPerShare * userInfo.lpAmount) / ACC_REWARDS_PRECISION;
            userInfo.pendingRewards += sharesReward - userInfo.rewardDebit;
            userInfo.rewardDebit = sharesReward;
        }
        lpToken.safeTransferFrom(msg.sender, address(this), amount_);
        _stakeRemote(user_, amount_);
        userInfo.lpAmount += amount_;
        totalLpAmount += amount_;
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

        uint256 sharesReward = (accRewardPerShare * userInfo.lpAmount) / ACC_REWARDS_PRECISION;
        console.log("BondLPFarmingPool.sharesReward", sharesReward);
        uint256 pendingRewards = userInfo.pendingRewards + sharesReward - userInfo.rewardDebit;
        userInfo.rewardDebit = sharesReward;
        userInfo.pendingRewards = 0;
        _unstakeRemote(user, amount_);
        if (amount_ > 0) {
            userInfo.lpAmount -= amount_;
            totalLpAmount -= amount_;
            // send staked assets
            lpToken.safeTransfer(user, amount_);
        }

        // send rewards
        bondToken.safeTransfer(user, pendingRewards);
        userInfo.claimedRewards += pendingRewards;
        masterChef.withdrawForUser(masterChefPid, amount_, user);

        emit Unstaked(user, amount_);
    }

    function unstakeAll() public {
        require(usersInfo[msg.sender].lpAmount > 0, "nothing to unstake");
        unstake(usersInfo[msg.sender].lpAmount);
    }

    function setBondRewardsSuspended(bool suspended_) public onlyAdmin {
        _updatePools();
        bondRewardsSuspended = suspended_;
    }

    function claimBonuses() public {
        unstake(0);
    }
}
