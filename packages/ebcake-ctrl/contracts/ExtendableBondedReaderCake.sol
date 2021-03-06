// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@private/shared/libs/Adminable.sol";
import "@private/shared/3rd/pancake/IPancakePair.sol";
import "@private/shared/3rd/pancake/ICakePool.sol";
import "@private/shared/mocks/pancake/MasterChefV2.sol";

import "@private/shared/interfaces/ebcake/IExtendableBond.sol";
import "@private/shared/interfaces/ebcake/underlyings/pancake/IExtendableBondedCake.sol";
import "@private/shared/interfaces/ebcake/underlyings/pancake/IBondLPPancakeFarmingPool.sol";

import "./ExtendableBondReader.sol";
import "./ExtendableBondRegistry.sol";


contract ExtendableBondedReaderCake is ExtendableBondReader, Initializable, Adminable {
    using Math for uint256;

    uint constant WEI_PER_EHTER = 1e18;
    uint constant PANCAKE_BOOST_WEIGHT = 2e13;
    uint constant PANCAKE_DURATION_FACTOR = 365 * 24 * 60 * 60;
    uint constant PANCAKE_PRECISION_FACTOR = 1e12;
    uint constant PANCAKE_CAKE_POOL_ID = 0;

    struct ExtendableBondGroupInfo {
        uint256 allEbStacked;
        uint256 ebCommonPriceAsUsd;
        uint256 duetSideAPR;
        uint256 underlyingSideAPR;
    }

    struct AddressBook {
      address underlyingToken;
      address bondToken;
      address lpToken;
      address bondFarmingPool;
      address bondLpFarmingPool;
      uint256 bondFarmingPoolId;
      uint256 bondLpFarmingPoolId;
      address pancakePool;
    }

    ExtendableBondRegistry public registry;
    ICakePool public pancakePool;
    MasterChefV2 public pancakeMasterChef;
    IPancakePair public pairTokenAddress__CAKE_BUSD;
    IPancakePair public pairTokenAddress__DUET_anyUSD;

    function initialize(
      address admin_,
      address registry_,
      address pancakePool_,
      address pancakeMasterChef_,
      address pairTokenAddress__CAKE_BUSD_,
      address pairTokenAddress__DUET_anyUSD_
    ) public initializer {
      require(admin_ != address(0), "Cant set admin to zero address");
      _setAdmin(admin_);
      updateReferences(registry_, pancakePool_, pancakeMasterChef_, pairTokenAddress__CAKE_BUSD_, pairTokenAddress__DUET_anyUSD_);
    }

    function updateReferences(
      address registry_,
      address pancakePool_,
      address pancakeMasterChef_,
      address pairTokenAddress__CAKE_BUSD_,
      address pairTokenAddress__DUET_anyUSD_
    ) public onlyAdmin {
      require(registry_ != address(0), "Cant set Registry to zero address");
      registry = ExtendableBondRegistry(registry_);
      require(pancakePool_ != address(0), "Cant set PancakePool to zero address");
      pancakePool = ICakePool(pancakePool_);
      require(pancakeMasterChef_ != address(0), "Cant set PancakeMasterChef to zero address");
      pancakeMasterChef = MasterChefV2(pancakeMasterChef_);
      require(pairTokenAddress__CAKE_BUSD_ != address(0), "Cant set PairTokenAddress__CAKE_BUSD to zero address");
      pairTokenAddress__CAKE_BUSD = IPancakePair(pairTokenAddress__CAKE_BUSD_);
      require(pairTokenAddress__DUET_anyUSD_ != address(0), "Cant set pairTokenAddress__DUET_anyUSD to zero address");
      pairTokenAddress__DUET_anyUSD = IPancakePair(pairTokenAddress__DUET_anyUSD_);
    }


    function addressBook(IExtendableBondedCake eb_) view external returns (AddressBook memory book) {
      IBondFarmingPool bondFarmingPool = IBondFarmingPool(eb_.bondFarmingPool());
      IBondLPPancakeFarmingPool bondLpFarmingPool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());

      book.underlyingToken = eb_.underlyingToken();
      book.bondToken = eb_.bondToken();
      book.lpToken = bondLpFarmingPool.lpToken();
      book.bondFarmingPool = eb_.bondFarmingPool();
      book.bondLpFarmingPool = eb_.bondLPFarmingPool();
      book.bondFarmingPoolId = bondFarmingPool.masterChefPid();
      book.bondLpFarmingPoolId = bondLpFarmingPool.masterChefPid();
      book.pancakePool = eb_.cakePool();
    }

    // -------------

    function extendableBondGroupInfo(string calldata groupName_) view external returns (ExtendableBondGroupInfo memory) {
        uint256 allEbStacked;
        uint256 sumCakePrices;
        address[] memory addresses = registry.groupedAddresses(groupName_);
        uint256 maxDuetSideAPR;
        for (uint256 i; i < addresses.length; i++) {
            address ebAddress = addresses[i];
            IExtendableBond eb = IExtendableBond(ebAddress);
            allEbStacked += eb.totalUnderlyingAmount();
            sumCakePrices += _unsafely_getUnderlyingPriceAsUsd(eb);
            uint256 underlyingAPY = _getUnderlyingAPY(eb);
            uint256 extraMaxSideAPR = _getSingleStake_bDuetAPR(eb).max(_getLpStake_bDuetAPR(eb));
            maxDuetSideAPR = maxDuetSideAPR.max(underlyingAPY + extraMaxSideAPR);
        }
        uint256 cakeCommonPrice = addresses.length > 0 ? sumCakePrices / addresses.length : 0;
        uint256 underlyingSideAPR = _getPancakeSyrupAPR();

        ExtendableBondGroupInfo memory ebGroupInfo = ExtendableBondGroupInfo({
            allEbStacked: allEbStacked,
            ebCommonPriceAsUsd: cakeCommonPrice,
            duetSideAPR: maxDuetSideAPR,
            underlyingSideAPR: underlyingSideAPR
        });
        return ebGroupInfo;
    }

    // -------------

    /**
     * Estimates token price by multi-fetching data from DEX.
     * There are some issues like time-lag and precision problems.
     * It's OK to do estimation but not for trading basis.
     */
    function _unsafely_getDuetPriceAsUsd(IExtendableBond eb_) view internal override returns (uint256) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(pool.lpToken());

        uint256 ebCakeLpTotalSupply = cakeWithEbCakeLpPairToken.totalSupply();
        if (ebCakeLpTotalSupply == 0) return 0;

        ( uint256 duetReserve, uint256 usdReserve, ) = pairTokenAddress__DUET_anyUSD.getReserves();
        if (usdReserve == 0 ) return 0;
        return duetReserve / usdReserve * ebCakeLpTotalSupply;
    }

    /**
     * Estimates token price by multi-fetching data from DEX.
     * There are some issues like time-lag and precision problems.
     * It's OK to do estimation but not for trading basis.
     */
    function _unsafely_getUnderlyingPriceAsUsd(IExtendableBond eb_) view internal override returns (uint256) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(pool.lpToken());

        uint256 ebCakeLpTotalSupply = cakeWithEbCakeLpPairToken.totalSupply();
        if (ebCakeLpTotalSupply == 0) return 0;
        ( uint256 cakeReserve, uint256 busdReserve, ) = pairTokenAddress__CAKE_BUSD.getReserves();
        if (busdReserve == 0 ) return 0;
        return cakeReserve / busdReserve * ebCakeLpTotalSupply;
    }

    function _getBondPriceAsUnderlying(IExtendableBond eb_) view internal override returns (uint256) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(pool.lpToken());

        ( uint256 cakeReserve, uint256 ebCakeReserve, ) = cakeWithEbCakeLpPairToken.getReserves();
        if (ebCakeReserve == 0) return 0;
        return cakeReserve / ebCakeReserve;
    }

    function _getLpStackedReserves(IExtendableBond eb_) view internal override returns (uint256 cakeReserve, uint256 ebCakeReserve) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(pool.lpToken());

        ( cakeReserve, ebCakeReserve, ) = cakeWithEbCakeLpPairToken.getReserves();
    }

    function _getLpStackedTotalSupply(IExtendableBond eb_) view internal override returns (uint256) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(pool.lpToken());

        return cakeWithEbCakeLpPairToken.totalSupply();
    }

    function _getEbFarmingPoolId(IExtendableBond eb_) view internal override returns (uint256) {
        IBondLPPancakeFarmingPool pool = IBondLPPancakeFarmingPool(eb_.bondLPFarmingPool());
        return pool.masterChefPid();
    }

    function _getUnderlyingAPY(IExtendableBond eb_) view internal override returns (uint256) {
        IExtendableBondedCake eb = IExtendableBondedCake(address(eb_));
        ICakePool pool = ICakePool(eb.cakePool());
        ICakePool.UserInfo memory pui = pool.userInfo(eb.bondToken());

        uint specialFarmsPerBlock = pancakeMasterChef.cakePerBlock(false);
        ( , , uint allocPoint, , ) = pancakeMasterChef.poolInfo(PANCAKE_CAKE_POOL_ID);

        uint totalSpecialAllocPoint = pancakeMasterChef.totalSpecialAllocPoint();
        if (totalSpecialAllocPoint == 0) return 0;

        uint cakePoolSharesInSpecialFarms = allocPoint / totalSpecialAllocPoint;
        uint totalCakePoolEmissionPerYear = specialFarmsPerBlock * BLOCKS_PER_YEAR * cakePoolSharesInSpecialFarms;

        uint pricePerFullShareAsEther = pancakePool.getPricePerFullShare();
        uint totalSharesAsEther = pancakePool.totalShares();

        uint flexibleApy = totalCakePoolEmissionPerYear * WEI_PER_EHTER / pricePerFullShareAsEther / totalSharesAsEther * 100;

        uint256 duration = pui.lockEndTime - pui.lockStartTime;
        uint boostFactor = PANCAKE_BOOST_WEIGHT * duration.max(0) / PANCAKE_DURATION_FACTOR / PANCAKE_PRECISION_FACTOR;

        uint lockedAPY = flexibleApy * (boostFactor + 1);
        return lockedAPY;
    }

    // function _getLpStake_extraAPR(IExtendableBond eb_) view internal override returns (uint256) {
    //     ( , , uint allocPoint, , bool isRegular ) = pancakeMasterChef.poolInfo(PANCAKE_CAKE_POOL_ID);

    //     uint totalAllocPoint = isRegular ? pancakeMasterChef.totalRegularAllocPoint() : pancakeMasterChef.totalSpecialAllocPoint();
    //      if (totalAllocPoint == 0) return 0;

    //     uint poolWeight = allocPoint / totalAllocPoint;
    //     uint cakePerYear = pancakeMasterChef.cakePerBlock(isRegular) * BLOCKS_PER_YEAR;

    //     uint yearlyCakeRewardAllocation = poolWeight * cakePerYear;
    //     uint cakePrice = _unsafely_getUnderlyingPriceAsUsd(eb_);


    //     IPancakePair cakeWithBusdLpPairToken = IPancakePair(pairTokenAddress__CAKE_BUSD);
    //     uint lpShareRatio = cakeWithBusdLpPairToken.balanceOf(address(eb_.cakePool())) / cakeWithBusdLpPairToken.totalSupply();

    //     uint liquidityUSD = farm.reserveUSD; <x>


    //     uint poolLiquidityUsd = lpShareRatio * liquidityUSD;
    //     return yearlyCakeRewardAllocation * cakePrice / WEI_PER_EHTER / poolLiquidityUsd * 100;
    // }


    // -------------

    function _getPancakeSyrupAPR() view internal returns (uint256) {
        ( , , uint allocPoint, , bool isRegular ) = pancakeMasterChef.poolInfo(PANCAKE_CAKE_POOL_ID);

        uint totalAllocPoint = (isRegular ? pancakeMasterChef.totalRegularAllocPoint() : pancakeMasterChef.totalSpecialAllocPoint());
        if (totalAllocPoint == 0) return 0;

        uint poolWeight = allocPoint / totalAllocPoint;
        uint farmsPerBlock = poolWeight * pancakeMasterChef.cakePerBlock(isRegular);

        uint totalCakePoolEmissionPerYear = farmsPerBlock * BLOCKS_PER_YEAR * farmsPerBlock;

        uint pricePerFullShare = pancakePool.getPricePerFullShare();
        uint totalShares = pancakePool.totalShares();
        uint sharesRatio = pricePerFullShare * totalShares / 100;
        if (sharesRatio == 0) return 0;

        uint flexibleAPY = totalCakePoolEmissionPerYear * WEI_PER_EHTER / sharesRatio;

        uint performanceFeeAsDecimal = 2;
        uint rewardPercentageNoFee = 1 - performanceFeeAsDecimal / 100;
        return flexibleAPY * rewardPercentageNoFee;
    }

}

