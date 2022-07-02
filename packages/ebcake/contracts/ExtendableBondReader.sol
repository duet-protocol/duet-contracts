// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ExtendableBond.sol";
import "./MultiRewardsMasterChef.sol";
import "./BondFarmingPool.sol";
import "./BondLPFarmingPool.sol";


abstract contract ExtendableBondReader {

    uint constant BLOCKS_PER_YEAR = (60 / 3) * 60 * 24 * 365;

    struct ExtendableBondPackagePublicInfo {
        string name;
        string symbol;
        uint8 decimals;

        uint256 underlyingUsdPrice;
        uint256 bondUnderlyingPrice;

        bool convertable;
        uint256 convertableFrom;
        uint256 convertableEnd;
        bool redeemable;
        uint256 redeemableFrom;
        uint256 redeemableEnd;
        uint256 maturity;

        uint256 underlyingAPY;
        uint256 singleStake_totalStaked;
        uint256 singleStake_bDuetAPR;
        uint256 lpStake_totalStaked;
        uint256 lpStake_bDuetAPR;
        // uint256 lpStake_extraAPY;
    }

    struct ExtendableBondSingleStakePackageUserInfo {
        int256 singleStake_staked;
        int256 singleStake_ebEarnedToDate;
        uint256 singleStake_bDuetPendingRewards;
        uint256 singleStake_bDuetClaimedRewards;
    }

    struct ExtendableBondLpStakePackageUserInfo {
        uint256 lpStake_underlyingStaked;
        uint256 lpStake_bondStaked;
        uint256 lpStake_lpStaked;
        uint256 lpStake_ebPendingRewards;
        uint256 lpStake_lpClaimedRewards;
        uint256 lpStake_bDuetPendingRewards;
        uint256 lpStake_bDuetClaimedRewards;
    }

    // -------------


    function extendableBondPackagePublicInfo(ExtendableBond eb_) view external returns (ExtendableBondPackagePublicInfo memory) {
        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
        BondLPFarmingPool bondLPFarmingPool = BondLPFarmingPool(address(eb_.bondLPFarmingPool()));
        (
            bool convertable,
            uint256 convertableFrom,
            uint256 convertableEnd,
            bool redeemable,
            uint256 redeemableFrom,
            uint256 redeemableEnd,
            uint256 maturity
        ) = eb_.checkPoints();
        ERC20 token = ERC20(address(eb_.bondToken()));

        ExtendableBondPackagePublicInfo memory packageInfo = ExtendableBondPackagePublicInfo({
            name: token.name(),
            symbol: token.symbol(),
            decimals: token.decimals(),

            underlyingUsdPrice: _unsafely_getUnderlyingPriceAsUsd(eb_),
            bondUnderlyingPrice: _getBondPriceAsUnderlying(eb_),

            convertable: convertable,
            convertableFrom: convertableFrom,
            convertableEnd: convertableEnd,
            redeemable: redeemable,
            redeemableFrom: redeemableFrom,
            redeemableEnd: redeemableEnd,
            maturity: maturity,

            underlyingAPY: _getUnderlyingAPY(eb_),
            singleStake_totalStaked: bondFarmingPool.underlyingAmount(false),
            singleStake_bDuetAPR: _getSingleStake_bDuetAPR(eb_),
            lpStake_totalStaked: bondLPFarmingPool.totalLpAmount(),
            lpStake_bDuetAPR: _getLpStake_bDuetAPR(eb_)
            // // lpStake_extraAPY: _getLpStake_extraAPR(eb_) ??
        });
        return packageInfo;
    }

    function extendableBondSingleStakePackageUserInfo(ExtendableBond eb_) view external returns (ExtendableBondSingleStakePackageUserInfo memory) {
        address user = msg.sender;
        require(user != address(0), "Invalid sender address");

        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));

        ( uint256 bondFarmingUsershares, ) = bondFarmingPool.usersInfo(user);

        uint256 singleStake_bDuetPendingRewards = _getPendingRewardsAmount(eb_, bondFarmingPool.masterChefPid(), user);
        uint256 claimedRewardsAmount = _getUserClaimedRewardsAmount(eb_, bondFarmingPool.masterChefPid(), user);

        ExtendableBondSingleStakePackageUserInfo memory packageInfo = ExtendableBondSingleStakePackageUserInfo({
            singleStake_staked: int256(bondFarmingPool.sharesToBondAmount(bondFarmingUsershares)),
            singleStake_ebEarnedToDate: bondFarmingPool.earnedToDate(user),
            singleStake_bDuetPendingRewards: singleStake_bDuetPendingRewards,
            singleStake_bDuetClaimedRewards: claimedRewardsAmount
        });
        return packageInfo;
    }

    function extendableBondLpStakePackageUserInfo(ExtendableBond eb_) view external returns (ExtendableBondLpStakePackageUserInfo memory) {
        address user = msg.sender;
        require(user != address(0), "Invalid sender address");

        BondLPFarmingPool bondLPFarmingPool = BondLPFarmingPool(address(eb_.bondLPFarmingPool()));
        ( uint256 lpStake_lpStaked, , , uint256 lpClaimedRewards )
            = bondLPFarmingPool.usersInfo(user);
        ( uint256 lpStake_underlyingStaked, uint256 lpStake_bondStaked )
            = _getLpStakeDetail(eb_, lpStake_lpStaked);

        uint256 lpStake_bDuetPendingRewards = _getPendingRewardsAmount(eb_, _getEbFarmingPoolId(eb_), user);
        uint256 lpStake_ebPendingRewards = bondLPFarmingPool.getUserPendingRewards(user);

        uint256 bDuetClaimedRewardsAmount = _getUserClaimedRewardsAmount(eb_, _getEbFarmingPoolId(eb_), user);

        ExtendableBondLpStakePackageUserInfo memory packageInfo = ExtendableBondLpStakePackageUserInfo({
            lpStake_underlyingStaked: lpStake_underlyingStaked,
            lpStake_bondStaked: lpStake_bondStaked,
            lpStake_lpStaked: lpStake_lpStaked,
            lpStake_ebPendingRewards: lpStake_ebPendingRewards,
            lpStake_lpClaimedRewards: lpClaimedRewards,
            lpStake_bDuetPendingRewards: lpStake_bDuetPendingRewards,
            lpStake_bDuetClaimedRewards: bDuetClaimedRewardsAmount
        });
        return packageInfo;
    }

    // -------------

    function _unsafely_getDuetPriceAsUsd(ExtendableBond eb_) view internal virtual returns (uint256) {}

    function _unsafely_getUnderlyingPriceAsUsd(ExtendableBond eb_) view internal virtual returns (uint256) {}

    function _getBondPriceAsUnderlying(ExtendableBond eb_) view internal virtual returns (uint256) {}

    function _getLpStackedReserves(ExtendableBond eb_) view internal virtual returns (uint256, uint256) {}

    function _getLpStackedTotalSupply(ExtendableBond eb_) view internal virtual returns (uint256) {}

    function _getEbFarmingPoolId(ExtendableBond eb_) view internal virtual returns (uint256) {}

    function _getUnderlyingAPY(ExtendableBond eb_) view internal virtual returns (uint256) {}

    // function _getLpStake_extraAPR(ExtendableBond eb_) view internal virtual returns (uint256) {}

    // -------------

    function _getSingleStake_bDuetAPR(ExtendableBond eb_) view internal returns (uint256) {
        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
        return _getBDuetAPR(eb_, bondFarmingPool.masterChefPid());
    }

    function _getLpStake_bDuetAPR(ExtendableBond eb_) view internal returns (uint256) {
        return _getBDuetAPR(eb_, _getEbFarmingPoolId(eb_));
    }

    // @TODO: extract as utils
    function _getBDuetAPR(ExtendableBond eb_, uint256 pid_) view internal returns (uint256 apr) {
        uint256 bondTokenBalance = eb_.bondToken().totalSupply();
        if (bondTokenBalance == 0) return apr;

        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
        MultiRewardsMasterChef mMasterChef = MultiRewardsMasterChef(address(bondFarmingPool.masterChef()));

        uint256 totalAllocPoint = mMasterChef.totalAllocPoint();
        if (totalAllocPoint == 0) return apr;

        uint256 unsafe_duetPriceAsUsd = _unsafely_getDuetPriceAsUsd(eb_);
        uint256 underlyingPriceAsUsd = _unsafely_getUnderlyingPriceAsUsd(eb_);
        if (underlyingPriceAsUsd == 0) return apr;

        ( , uint256 allocPoint, , , ) = mMasterChef.poolInfo(pid_);
        for (uint256 rewardId; rewardId < mMasterChef.getRewardSpecsLength(); rewardId++) {
            ( , uint256 rewardPerBlock, , , ) = mMasterChef.rewardSpecs(rewardId);
            apr += rewardPerBlock * 1e4 * allocPoint
                    / totalAllocPoint
                    * BLOCKS_PER_YEAR
                    * unsafe_duetPriceAsUsd
                    / (bondTokenBalance * underlyingPriceAsUsd);
        }
    }

    function _getUserClaimedRewardsAmount(ExtendableBond eb_, uint pid_, address user_) view internal returns (uint256 amount) {
        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
        MultiRewardsMasterChef mMasterChef = MultiRewardsMasterChef(address(bondFarmingPool.masterChef()));

        for (uint256 rewardId; rewardId < mMasterChef.getRewardSpecsLength(); rewardId++) {
            amount += mMasterChef.getUserClaimedRewards(pid_, user_, rewardId);
        }
    }

    function _getPendingRewardsAmount(ExtendableBond eb_, uint pid_, address user_) view internal returns (uint256 amount) {
        BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
        MultiRewardsMasterChef mMasterChef = MultiRewardsMasterChef(address(bondFarmingPool.masterChef()));

        MultiRewardsMasterChef.RewardInfo[] memory rewardInfos = mMasterChef.pendingRewards(pid_, user_);
        for (uint256 rewardId; rewardId < mMasterChef.getRewardSpecsLength(); rewardId++) {
            amount += rewardInfos[rewardId].amount;
        }
    }

     function _getLpStakeDetail(ExtendableBond eb_, uint256 lpStaked) view internal returns (
        uint256 lpStake_underlyingStaked, uint256 lpStake_bondStaked
    ) {
        uint256 lpStackTotalSupply = _getLpStackedTotalSupply(eb_);

        ( uint256 lpStake_underlyingReserve, uint256 lpStake_bondReserve ) = _getLpStackedReserves(eb_);
        lpStake_underlyingStaked = lpStake_underlyingReserve * lpStaked / lpStackTotalSupply;
        lpStake_bondStaked = lpStake_bondReserve * lpStaked / lpStackTotalSupply;
    }

}

