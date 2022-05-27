// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

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

contract BondFarmingPool is Pausable, ReentrancyGuard, Ownable, IBondFarmingPool {
    using SafeERC20 for IERC20;
    IERC20 public bondToken;
    IExtendableBond public bond;
    uint256 public totalShares = 0;
    uint256 public lastUpdatedPoolAt = 0;
    IBondFarmingPool public siblingPool;

    MultiRewardsMasterChef public masterChef;
    uint256 public masterChefPid;

    struct UserInfo {
        /**
         * @dev described compounded underlying bond token amount, user's shares / total shares * underlying amount = user's amount.
         */
        uint256 shares;
        /**
         * @notice accumulated net staked amount. only for earned to date calculation.
         * @dev formula: accumulatedStakedAmount - accumulatedUnstakedAmount
         */
        int256 accNetStaked;
    }

    mapping(address => UserInfo) public usersInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(IERC20 bondToken_, IExtendableBond bond_) {
        bondToken = bondToken_;
        bond = bond_;
    }

    function setMasterChef(MultiRewardsMasterChef masterChef_, uint256 masterChefPid_) public onlyOwner {
        masterChef = masterChef_;
        masterChefPid = masterChefPid_;
    }

    function setSiblingPool(IBondFarmingPool siblingPool_) public onlyOwner {
        require(
            address(siblingPool_.siblingPool()) == address(0) || address(siblingPool_.siblingPool()) == address(this),
            "Invalid sibling"
        );
        siblingPool = siblingPool_;
    }

    function claimBonuses() public {
        address user = msg.sender;
        UserInfo storage userInfo = usersInfo[user];
        require(userInfo.shares > 0, "Nothing to claim");

        masterChef.withdrawForUser(masterChefPid, 0, user);
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
        require(address(siblingPool) != address(0), "BondFarmingPool: Contract not ready yet.");
        // Single bond token farming rewards base on  'bond token mount in pool' / 'total bond token supply' * 'total underlying rewards' and remaining rewards for LP pools.
        // So single bond farming pool should be updated before LP's.
        require(
            siblingPool.lastUpdatedPoolAt() < block.number ||
                (siblingPool.lastUpdatedPoolAt() == lastUpdatedPoolAt && lastUpdatedPoolAt == block.number),
            "update bond pool firstly."
        );
        uint256 pendingRewards = totalPendingRewards();
        console.log("contract updatePool pendingRewards: ", pendingRewards);
        lastUpdatedPoolAt = block.number;
        if (pendingRewards <= 0) {
            return;
        }
        bond.mintBondTokenForRewards(address(this), pendingRewards);
    }

    /**
     * @dev calculate earned amount to date of specific user.
     */
    function earnedToDate(address user_) public view returns (int256) {
        UserInfo storage userInfo = usersInfo[user_];
        return int256(sharesToBondAmount(userInfo.shares)) - userInfo.accNetStaked;
    }

    function totalPendingRewards() public view virtual returns (uint256) {
        if (lastUpdatedPoolAt == block.number) {
            return 0;
        }
        uint256 remoteTotalPendingRewards = bond.totalPendingRewards();

        console.log("BondFarmingPool.remoteTotalPendingRewards", uint256(remoteTotalPendingRewards));
        if (remoteTotalPendingRewards <= 0) {
            return 0;
        }
        uint256 poolBalance = bondToken.balanceOf(address(this));
        if (poolBalance <= 0) {
            return 0;
        }
        console.log("contract: remoteTotalPendingRewards", uint256(remoteTotalPendingRewards));
        console.log("contract: pool balance", bondToken.balanceOf(address(this)));
        console.log("contract: bondToken.totalSupply()", bondToken.totalSupply());
        return DuetMath.mulDiv(uint256(remoteTotalPendingRewards), poolBalance, bondToken.totalSupply());
    }

    function pendingRewardsByShares(uint256 shares_) public view returns (uint256) {
        if (shares_ <= 0) {
            return 0;
        }
        return DuetMath.mulDiv(totalPendingRewards(), shares_, totalShares);
    }

    function sharesToBondAmount(uint256 shares_) public view returns (uint256) {
        if (shares_ <= 0) {
            return 0;
        }
        return DuetMath.mulDiv(underlyingAmount(), shares_, totalShares);
    }

    function amountToShares(uint256 amount_) public view returns (uint256) {
        return totalShares > 0 ? DuetMath.mulDiv(amount_, totalShares, underlyingAmount()) : amount_;
    }

    function underlyingAmount() public view returns (uint256) {
        return totalPendingRewards() + bondToken.balanceOf(address(this));
    }

    function stake(uint256 amount_) public whenNotPaused {
        address user = msg.sender;
        stakeForUser(user, amount_);
    }

    function stakeForUser(address user_, uint256 amount_) public whenNotPaused nonReentrant {
        // distributing pending rewards of all sibling pools to correct reward ratio between them.
        _updatePools();

        uint256 stakeShares = amountToShares(amount_);
        console.log("stakeShares", stakeShares);
        bondToken.safeTransferFrom(msg.sender, address(this), amount_);
        totalShares += stakeShares;
        usersInfo[user_].shares += stakeShares;
        usersInfo[user_].accNetStaked += int256(amount_);
        masterChef.depositForUser(masterChefPid, stakeShares, user_);
        emit Staked(user_, amount_);
    }

    function _updatePools() internal {
        _updatePool();
        siblingPool.updatePool();
    }

    function unstakeAll() public {
        require(usersInfo[msg.sender].shares > 0, "nothing to unstake");
        unstake(usersInfo[msg.sender].shares);
    }

    /**
     * @notice unstake by shares
     */
    function unstake(uint256 shares_) public whenNotPaused nonReentrant {
        address user = msg.sender;
        UserInfo storage userInfo = usersInfo[user];
        require(userInfo.shares >= shares_ && totalShares >= shares_, "unstake shares exceeds owned shares");

        // distribute pending rewards of all sibling pools to correct reward ratio between them.
        _updatePools();

        // including rewards.
        uint256 totalBondAmount = sharesToBondAmount(shares_);
        userInfo.shares -= shares_;
        totalShares -= shares_;
        console.log("unstake.underlying", underlyingAmount());
        console.log("unstake.balance", bondToken.balanceOf(address(this)));
        console.log("unstake.totalBondAmount", totalBondAmount);

        bondToken.safeTransfer(user, totalBondAmount);
        usersInfo[user].accNetStaked -= int256(totalBondAmount);
        masterChef.withdrawForUser(masterChefPid, shares_, user);
        emit Unstaked(user, totalBondAmount);
    }
}
