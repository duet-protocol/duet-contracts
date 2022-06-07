// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "../../ExtendableBond.sol";
import "../../interfaces/ICakePool.sol";

contract ExtendableBondedCake is ExtendableBond {
    /**
     * CakePool contract
     */
    ICakePool public cakePool;

    function setCakePool(ICakePool cakePool_) external onlyAdmin {
        cakePool = cakePool_;
    }

    /**
     * @dev calculate cake amount from pancake.
     */
    function remoteUnderlyingAmount() public view override returns (uint256) {
        ICakePool.UserInfo memory userInfo = cakePool.userInfo(address(this));
        uint256 pricePerFullShare = cakePool.getPricePerFullShare();
        return
            (userInfo.shares * pricePerFullShare) /
            1e18 -
            userInfo.userBoostedShare -
            cakePool.calculateWithdrawFee(address(this), userInfo.shares);
    }

    /**
     * @dev calculate cake amount from pancake.
     */
    function pancakeUserInfo() public view returns (ICakePool.UserInfo memory) {
        return cakePool.userInfo(address(this));
    }

    /**
     * @dev withdraw from pancakeswap
     */
    function _withdrawFromRemote(uint256 amount_) internal override {
        cakePool.withdrawByAmount(amount_);
    }

    /**
     * @dev deposit to pancakeswap
     */
    function _depositRemote(uint256 amount_) internal override {
        uint256 balance = underlyingToken.balanceOf(address(this));
        require(balance > 0 && balance >= amount_, "nothing to deposit");
        underlyingToken.approve(address(cakePool), amount_);
        cakePool.deposit(amount_, secondsToPancakeLockExtend());
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
     * @dev Withdraw cake from cake pool.
     */
    function withdrawAllCakesFromPancake(bool makeRedeemable_) public onlyAdminOrKeeper {
        checkPoints.convertable = false;
        cakePool.withdrawAll();
        if (makeRedeemable_) {
            checkPoints.redeemable = true;
        }
    }

    /**
     * @dev extend pancake lock duration if needs
     */
    function extendPancakeLockDuration() public onlyAdminOrKeeper {
        uint256 secondsToExtend = secondsToPancakeLockExtend();
        if (secondsToExtend > 0) {
            cakePool.deposit(0, secondsToPancakeLockExtend());
        }
    }
}
