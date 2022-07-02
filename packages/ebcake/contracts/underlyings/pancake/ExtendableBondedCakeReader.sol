// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ExtendableBondedCake.sol";
import "./BondLPPancakeFarmingPool.sol";
import "../../ExtendableBond.sol";
import "../../ExtendableBondReader.sol";
import "../../ExtendableBondRegistry.sol";
import "../../interfaces/ICakePool.sol";
import "../../interfaces/IPancakePair.sol";
import "../../mocks/CakePool.sol";
import "../../mocks/MasterChefV2.sol";


contract ExtendableBondedCakeReader is Initializable, ExtendableBondReader {
    using Math for uint256;

    uint constant BOOST_WEIGHT = 2e13;
    uint constant DURATION_FACTOR = 365 * 24 * 60 * 60;
    uint constant PRECISION_FACTOR = 1e12;
    uint constant WEI_PER_EHTER = 1e18;
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
    CakePool public pancakePool;
    MasterChefV2 public pancakeMasterChef;
    IPancakePair public pairTokenAddress__CAKE_BUSD;
    IPancakePair public pairTokenAddress__DUET_BUSD;
    IPancakePair public pairTokenAddress__DUET_CAKE;

    function initialize(
      address registry_,
      address pancakePool_,
      address pancakeMasterChef_,
      address pairTokenAddress__CAKE_BUSD_,
      address pairTokenAddress__DUET_BUSD_,  // optional. if so, the next should be required
      address pairTokenAddress__DUET_CAKE_   // optional, if so, the previous should be required
    ) public initializer {
        require(registry_ != address(0), "Cant set Registry to zero address");
        registry = ExtendableBondRegistry(registry_);
        require(pancakePool_ != address(0), "Cant set PancakePool to zero address");
        pancakePool = CakePool(pancakePool_);
        require(pancakeMasterChef_ != address(0), "Cant set PancakeMasterChef to zero address");
        pancakeMasterChef = MasterChefV2(pancakeMasterChef_);
        require(pairTokenAddress__CAKE_BUSD_ != address(0), "Cant set PairTokenAddress__CAKE_BUSD to zero address");
        pairTokenAddress__CAKE_BUSD = IPancakePair(pairTokenAddress__CAKE_BUSD_);

        require(
          pairTokenAddress__DUET_BUSD_ != address(0) || pairTokenAddress__DUET_CAKE_ != address(0),
          "Must set atlease one non-zero address in (PairTokenAddress__DUET_BUSD, PairTokenAddress__DUET_CAKE)"
        );
        pairTokenAddress__DUET_BUSD = IPancakePair(pairTokenAddress__DUET_BUSD_);
        pairTokenAddress__DUET_CAKE = IPancakePair(pairTokenAddress__DUET_CAKE_);
    }

    function addressBook(ExtendableBondedCake eb_) view external returns (AddressBook memory book) {
      BondFarmingPool bondFarmingPool = BondFarmingPool(address(eb_.bondFarmingPool()));
      BondLPPancakeFarmingPool bondLpFarmingPool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));

      book.underlyingToken = address(eb_.underlyingToken());
      book.bondToken = address(eb_.bondToken());
      book.lpToken = address(bondLpFarmingPool.lpToken());
      book.bondFarmingPool = address(eb_.bondFarmingPool());
      book.bondLpFarmingPool = address(eb_.bondLPFarmingPool());
      book.bondFarmingPoolId = bondFarmingPool.masterChefPid();
      book.bondLpFarmingPoolId = bondLpFarmingPool.masterChefPid();
      book.pancakePool = address(eb_.cakePool());
    }

    // -------------

    function extendableBondGroupInfo(string calldata groupName_) view external returns (ExtendableBondGroupInfo memory) {
        uint256 allEbStacked;
        uint256 sumCakePrices;
        address[] memory addresses = registry.groupedAddresses(groupName_);
        uint256 maxDuetSideAPR;
        for (uint256 i; i < addresses.length; i++) {
            address ebAddress = addresses[i];
            ExtendableBondedCake eb = ExtendableBondedCake(ebAddress);
            allEbStacked += ExtendableBond(ebAddress).totalUnderlyingAmount();
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
    function _unsafely_getDuetPriceAsUsd(ExtendableBond eb_) view internal override returns (uint256) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(address(pool.lpToken()));

        uint256 ebCakeLpTotalSupply = cakeWithEbCakeLpPairToken.totalSupply();
        if (ebCakeLpTotalSupply == 0) return 0;

        if (address(pairTokenAddress__DUET_BUSD) != address(0)) {
          ( uint256 duetReserve, uint256 busdReserve, ) = pairTokenAddress__DUET_BUSD.getReserves();
          if (busdReserve == 0 ) return 0;
          return duetReserve / busdReserve * ebCakeLpTotalSupply;
        }

        if (address(pairTokenAddress__DUET_CAKE) != address(0)) {
          ( uint256 cakeReserve0, uint256 busdReserve0, ) = pairTokenAddress__CAKE_BUSD.getReserves();
          ( uint256 duetReserve1, uint256 cakeReserve1, ) = pairTokenAddress__DUET_CAKE.getReserves();
          uint256 alignedDuetPoint = duetReserve1 * cakeReserve0;
          uint256 alignedBusdPoint = busdReserve0 * cakeReserve1;
          if (alignedBusdPoint == 0) return 0;
          return alignedDuetPoint / alignedBusdPoint * ebCakeLpTotalSupply;
        }
        return 0;
    }

    /**
     * Estimates token price by multi-fetching data from DEX.
     * There are some issues like time-lag and precision problems.
     * It's OK to do estimation but not for trading basis.
     */
    function _unsafely_getUnderlyingPriceAsUsd(ExtendableBond eb_) view internal override returns (uint256) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(address(pool.lpToken()));

        uint256 ebCakeLpTotalSupply = cakeWithEbCakeLpPairToken.totalSupply();
        if (ebCakeLpTotalSupply == 0) return 0;
        ( uint256 cakeReserve, uint256 busdReserve, ) = pairTokenAddress__CAKE_BUSD.getReserves();
        if (busdReserve == 0 ) return 0;
        return cakeReserve / busdReserve * ebCakeLpTotalSupply;
    }

    function _getBondPriceAsUnderlying(ExtendableBond eb_) view internal override returns (uint256) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(address(pool.lpToken()));

        ( uint256 cakeReserve, uint256 ebCakeReserve, ) = cakeWithEbCakeLpPairToken.getReserves();
        if (ebCakeReserve == 0) return 0;
        return cakeReserve / ebCakeReserve;
    }

    function _getLpStackedReserves(ExtendableBond eb_) view internal override returns (uint256 cakeReserve, uint256 ebCakeReserve) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(address(pool.lpToken()));

        ( cakeReserve, ebCakeReserve, ) = cakeWithEbCakeLpPairToken.getReserves();
    }

    function _getLpStackedTotalSupply(ExtendableBond eb_) view internal override returns (uint256) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        IPancakePair cakeWithEbCakeLpPairToken = IPancakePair(address(pool.lpToken()));

        return cakeWithEbCakeLpPairToken.totalSupply();
    }

    function _getEbFarmingPoolId(ExtendableBond eb_) view internal override returns (uint256) {
        BondLPPancakeFarmingPool pool = BondLPPancakeFarmingPool(address(eb_.bondLPFarmingPool()));
        return pool.masterChefPid();
    }

    function _getUnderlyingAPY(ExtendableBond eb_) view internal override returns (uint256) {
        ExtendableBondedCake eb = ExtendableBondedCake(address(eb_));
        ICakePool pool = eb.cakePool();
        ICakePool.UserInfo memory pui = pool.userInfo(address(eb.bondToken()));

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
        uint boostFactor = BOOST_WEIGHT * duration.max(0) / DURATION_FACTOR / PRECISION_FACTOR;

        uint lockedAPY = flexibleApy * (boostFactor + 1);
        return lockedAPY;
    }

    // function _getLpStake_extraAPR(ExtendableBond eb_) view internal override returns (uint256) {
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

