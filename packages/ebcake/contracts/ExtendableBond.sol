// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./BondToken.sol";
import "./interfaces/ICakePool.sol";
import "./interfaces/IBondFarmingPool.sol";
import "./libs/Adminable.sol";
import "./libs/Keepable.sol";

contract ExtendableBond is ReentrancyGuardUpgradeable, PausableUpgradeable, Adminable, Keepable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for BondToken;
    /**
     * Bond token contract
     */
    BondToken public bondToken;
    /**
     * CakePool contract
     */
    ICakePool public cakePool;
    /**
     * Bond underlying asset
     */
    IERC20Upgradeable public underlyingToken;

    /**
     * @dev factor for percentage that described in integer. It makes 10000 means 100%, and 20 means 0.2%;
     *      Calculation formula: x * percentage / PERCENTAGE_FACTOR
     */
    uint16 public PERCENTAGE_FACTOR;
    IBondFarmingPool bondFarmingPool;
    IBondFarmingPool bondLPFarmingPool;
    /**
     * Emitted when someone convert underlying token to the bond.
     */
    event Converted(uint256 amount, address indexed user);

    event MintedBondTokenForRewards(address indexed to, uint256 amount);

    struct FeeSpec {
        string desc;
        uint16 rate;
        address receiver;
    }

    /**
     * Fee specifications
     */
    FeeSpec[] public feeSpecs;

    struct CheckPoints {
        bool convertable;
        uint256 convertableFrom;
        uint256 convertableEnd;
        bool redeemable;
        uint256 redeemableFrom;
        uint256 redeemableEnd;
        uint256 maturity;
    }

    CheckPoints public checkPoints;
    modifier onlyAdminOrKeeper() virtual {
        require(msg.sender == admin || msg.sender == keeper, "UNAUTHORIZED");

        _;
    }

    function initialize(
        BondToken bondToken_,
        IERC20Upgradeable underlyingToken_,
        ICakePool cakePool_,
        address admin_
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();

        _setAdmin(admin_);
        PERCENTAGE_FACTOR = 10000;
        bondToken = bondToken_;
        underlyingToken = underlyingToken_;
        cakePool = cakePool_;
        admin = admin_;
    }

    /**
     * @notice Underlying token amount that hold in current contract.
     */
    function underlyingAmount() public view returns (uint256) {
        return underlyingToken.balanceOf(address(this));
    }

    /**
     * @notice total underlying token amount, including hold in current contract and cake pool
     */
    function totalUnderlyingAmount() public view returns (uint256) {
        return underlyingAmount() + remoteUnderlyingAmount();
    }

    /**
     * @dev Total pending rewards for bond. May be negative in some unexpected circumstances,
     *      such as remote underlying amount has unexpectedly decreased makes bond token over issued.
     */
    function totalPendingRewards() public view returns (uint256) {
        uint256 underlying = totalUnderlyingAmount();
        uint256 bondAmount = totalBondTokenAmount();
        if (bondAmount >= underlying) {
            return 0;
        }
        return underlying - bondAmount;
    }

    /**
     * @dev mint bond token for rewards and allocate fees.
     */
    function mintBondTokenForRewards(address to_, uint256 amount_) public nonReentrant {
        require(
            msg.sender == address(bondFarmingPool) || msg.sender == address(bondLPFarmingPool),
            "only from farming pool"
        );
        require(totalBondTokenAmount() + amount_ <= totalUnderlyingAmount(), "Can not over issue");

        // nothing to happen when reward amount is zero.
        if (amount_ <= 0) {
            return;
        }

        uint256 amountToTarget = amount_;

        // allocate fees.
        for (uint256 i = 0; i < feeSpecs.length; i++) {
            FeeSpec storage feeSpec = feeSpecs[i];
            uint256 feeAmount = (amountToTarget * feeSpec.rate) / PERCENTAGE_FACTOR;

            if (feeAmount <= 0) {
                continue;
            }
            amountToTarget -= feeAmount;
            bondToken.mint(feeSpec.receiver, feeAmount);
        }

        if (amountToTarget > 0) {
            bondToken.mint(to_, amountToTarget);
        }

        emit MintedBondTokenForRewards(to_, amount_);
    }

    /**
     * Bond token total amount.
     */
    function totalBondTokenAmount() public view returns (uint256) {
        return bondToken.totalSupply();
    }

    /**
     * calculate remote underlying token amount.
     */
    function remoteUnderlyingAmount() public view returns (uint256) {
        ICakePool.UserInfo memory userInfo = cakePool.userInfo(address(this));
        uint256 pricePerFullShare = cakePool.getPricePerFullShare();
        return
            (userInfo.shares * pricePerFullShare) /
            1e18 -
            cakePool.calculateWithdrawFee(address(this), userInfo.shares);
    }

    /**
     * @dev Redeem all my bond tokens to underlying tokens.
     */
    function redeemAll() external whenNotPaused {
        redeem(bondToken.balanceOf(msg.sender));
    }

    /**
     * @dev Redeem specific amount of my bond tokens.
     * @param amount_ amount to redeem
     */
    function redeem(uint256 amount_) public whenNotPaused nonReentrant {
        require(amount_ > 0, "Nothing to redeem");
        require(
            checkPoints.redeemable &&
                block.timestamp >= checkPoints.redeemableFrom &&
                block.timestamp <= checkPoints.redeemableEnd &&
                block.timestamp > checkPoints.convertableEnd,
            "Can not redeem."
        );

        address user = msg.sender;
        uint256 userBondTokenBalance = bondToken.balanceOf(user);
        require(amount_ <= userBondTokenBalance, "Insufficient balance");

        // burn user's bond token
        bondToken.burnFrom(user, amount_);

        uint256 underlyingTokenAmount = underlyingToken.balanceOf(address(this));
        if (underlyingTokenAmount < amount_) {
            cakePool.withdrawByAmount(amount_ - underlyingTokenAmount);
        }

        underlyingToken.safeTransfer(user, amount_);
    }

    function secondsToPancakeLockExtend() public view returns (uint256) {
        uint256 secondsToExtend = 0;
        uint256 currentTime = block.timestamp;
        ICakePool.UserInfo memory bondUnderlyingCakeInfo = cakePool.userInfo(address(this));
        // lock expired or cake lockEndTime earlier than maturity, extend lock time required.
        if (
            bondUnderlyingCakeInfo.lockEndTime <= currentTime ||
            !bondUnderlyingCakeInfo.locked ||
            bondUnderlyingCakeInfo.lockEndTime < checkPoints.maturity
        ) {
            secondsToExtend = MathUpgradeable.min(checkPoints.maturity - currentTime, cakePool.MAX_LOCK_DURATION());
        }
        return secondsToExtend >= 0 ? secondsToExtend : 0;
    }

    /**
     * @dev convert underlying token to bond token to current user
     */
    function convert(uint256 amount_) external whenNotPaused {
        require(amount_ > 0, "Nothing to convert");

        _convertOperation(amount_, msg.sender);
    }

    function requireConvertable() internal view {
        require(
            checkPoints.convertable &&
                block.timestamp >= checkPoints.convertableFrom &&
                block.timestamp <= checkPoints.convertableEnd &&
                block.timestamp < checkPoints.redeemableFrom,
            "Can not convert."
        );
    }

    function _updateFarmingPools() internal {
        bondFarmingPool.updatePool();
        bondLPFarmingPool.updatePool();
    }

    function setFarmingPools(IBondFarmingPool bondPool_, IBondFarmingPool lpPool_) public onlyAdmin {
        require(address(bondPool_) != address(0) && address(bondPool_) != address(lpPool_), "invalid farming pools");
        bondFarmingPool = bondPool_;
        bondLPFarmingPool = lpPool_;
    }

    /**
     * @dev convert underlying token to bond token and stake to bondFarmingPool for current user
     */
    function convertAndStake(uint256 amount_) external whenNotPaused {
        require(amount_ > 0, "Nothing to convert");
        requireConvertable();
        _updateFarmingPools();

        address user = msg.sender;
        underlyingToken.safeTransferFrom(user, address(this), amount_);
        underlyingToken.approve(address(cakePool), amount_);

        cakePool.deposit(amount_, secondsToPancakeLockExtend());
        // 1:1 mint bond token to current contract
        bondToken.mint(address(this), amount_);
        bondToken.approve(address(bondFarmingPool), amount_);
        // stake to bondFarmingPool
        bondFarmingPool.stakeForUser(user, amount_);
        emit Converted(amount_, user);
    }

    /**
     * @dev convert underlying token to bond token to specific user
     */
    function _convertOperation(uint256 amount_, address user_) internal nonReentrant {
        requireConvertable();
        _updateFarmingPools();

        underlyingToken.transferFrom(user_, address(this), amount_);
        underlyingToken.approve(address(cakePool), amount_);
        cakePool.deposit(amount_, secondsToPancakeLockExtend());
        // 1:1 mint bond token to user
        bondToken.mint(user_, amount_);
        emit Converted(amount_, user_);
    }

    function extendRemoteLockDate() public onlyKeeper {
        cakePool.deposit(0, secondsToPancakeLockExtend());
    }

    function updateCheckPoints(CheckPoints calldata checkPoints_) public onlyAdminOrKeeper {
        require(checkPoints_.convertableFrom > 0, "convertableFrom must be greater than 0");
        require(
            checkPoints_.convertableFrom < checkPoints_.convertableEnd,
            "redeemableFrom must be earlier than convertableEnd"
        );
        require(
            checkPoints_.redeemableFrom > checkPoints_.convertableEnd &&
                checkPoints_.redeemableFrom >= checkPoints_.maturity,
            "redeemableFrom must be later than convertableEnd and maturity"
        );
        require(
            checkPoints_.redeemableEnd > checkPoints_.redeemableFrom,
            "redeemableEnd must be later than redeemableFrom"
        );
        checkPoints = checkPoints_;
    }

    function setRedeemable(bool redeemable_) external onlyAdminOrKeeper {
        checkPoints.redeemable = redeemable_;
    }

    function setConvertable(bool convertable_) external onlyAdminOrKeeper {
        checkPoints.convertable = convertable_;
    }

    /**
     * @dev Withdraw cake from cake pool.
     */
    function withdrawRemoteUnderlyingTokens(bool makeRedeemable_) public onlyAdminOrKeeper {
        checkPoints.convertable = false;
        cakePool.withdrawAll();
        if (makeRedeemable_) {
            checkPoints.redeemable = true;
        }
    }

    /**
     * @dev emergency transfer underlying token for security issue or bug encounted.
     */
    function emergencyTransferUnderlyingTokens(address to_) external onlyAdmin {
        checkPoints.convertable = false;
        checkPoints.redeemable = false;
        underlyingToken.safeTransfer(to_, underlyingAmount());
    }

    function extendBond(CheckPoints calldata checkPoints_) public onlyAdminOrKeeper {
        updateCheckPoints(checkPoints_);
    }

    /**
     * @notice add
     */
    function addFeeSpec(FeeSpec calldata feeSpec_) external onlyAdmin {
        require(feeSpecs.length < 5, "Too many fee specs");
        require(feeSpec_.rate > 0, "Fee rate is too low");
        require(feeSpec_.rate <= PERCENTAGE_FACTOR, "Fee rate is too high");
        feeSpecs.push(feeSpec_);
        uint256 totalFeeRate = 0;
        for (uint256 i = 0; i < feeSpecs.length; i++) {
            totalFeeRate += feeSpecs[i].rate;
        }
        require(totalFeeRate <= PERCENTAGE_FACTOR, "Total fee rate greater than 100%.");
    }

    function depositToRemote(uint256 amount_) public onlyAdminOrKeeper {
        uint256 balance = underlyingToken.balanceOf(address(this));
        require(balance > 0 && balance >= amount_, "nothing to deposit");
        cakePool.deposit(amount_, secondsToPancakeLockExtend());
    }

    function depositAllToRemote() public onlyAdminOrKeeper {
        depositToRemote(underlyingToken.balanceOf(address(this)));
    }

    function removeFeeSpec(uint256 feeSpecIndex) external onlyAdmin {
        delete feeSpecs[feeSpecIndex];
    }

    function setKeeper(address newKeeper) external onlyAdmin {
        _setKeeper(newKeeper);
    }

    /**
     * @notice Trigger stopped state
     * @dev Only possible when contract not paused.
     */
    function pause() external onlyAdmin whenNotPaused {
        _pause();
    }

    /**
     * @notice Return to normal state
     * @dev Only possible when contract is paused.
     */
    function unpause() external onlyAdmin whenPaused {
        _unpause();
    }
}
