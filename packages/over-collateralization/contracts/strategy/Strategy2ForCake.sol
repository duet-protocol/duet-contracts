// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPair.sol";
import "../interfaces/ICakePool.sol";
import "../interfaces/IRouter02.sol";

import "./BaseStrategy.sol";

// stake Cake earn cake.
contract Strategy2ForCake is BaseStrategy {
    using SafeERC20 for IERC20;

    address public immutable cakepool;

    constructor(
        address _controller,
        address _fee,
        address _cakepool
    ) BaseStrategy(_controller, _fee, ICakePool(_cakepool).token(), ICakePool(_cakepool).token()) {
        cakepool = _cakepool;
        IERC20(output).safeApprove(cakepool, type(uint256).max);
    }

    function balanceOfPool() public view virtual override returns (uint256) {
        (uint256 userShares, , , , , , , , ) = ICakePool(cakepool).userInfo(address(this));
        uint256 pricePerFullShare = ICakePool(cakepool).getPricePerFullShare();
        uint256 amount = (userShares * pricePerFullShare) / 1e18;
        return amount;
    }

    function pendingOutput() external view virtual override returns (uint256) {
        (uint256 userShares, , uint256 cakeAtLastUserAction, , , , , , ) = ICakePool(cakepool).userInfo(address(this));
        uint256 pricePerFullShare = ICakePool(cakepool).getPricePerFullShare();
        uint256 amount = (userShares * pricePerFullShare) / 1e18 - cakeAtLastUserAction;
        return amount;
    }

    function deposit() public virtual override {
        uint256 dAmount = IERC20(want).balanceOf(address(this));
        if (dAmount > 0) {
            ICakePool(cakepool).deposit(dAmount, 0);
            emit Deposit(dAmount);
        }
    }

    // only call from dToken
    function withdraw(uint256 _amount) external virtual override {
        address dToken = IController(controller).dyTokens(want);
        require(msg.sender == dToken, "invalid caller");

        uint256 dAmount = IERC20(want).balanceOf(address(this));
        if (dAmount < _amount) {
            ICakePool(cakepool).withdrawByAmount(_amount - dAmount);
        }

        safeTransfer(want, dToken, _amount); // lp transfer to dToken
        emit Withdraw(_amount);
    }

    // should used for reset strategy
    function withdrawAll() external virtual override returns (uint256 balance) {
        address dToken = IController(controller).dyTokens(want);
        require(msg.sender == controller || msg.sender == dToken, "invalid caller");

        (uint256 userShares, , , , , , , , ) = ICakePool(cakepool).userInfo(address(this));
        if (userShares > 0) {
            ICakePool(cakepool).withdrawAll();
            uint256 balance = IERC20(want).balanceOf(address(this));
            IERC20(want).safeTransfer(dToken, balance);
            emit Withdraw(balance);
        }
    }

    function emergency() external override onlyOwner {
        ICakePool(cakepool).withdrawAll();

        uint256 amount = IERC20(want).balanceOf(address(this));
        address dToken = IController(controller).dyTokens(want);

        if (dToken != address(0)) {
            IERC20(want).safeTransfer(dToken, amount);
        } else {
            IERC20(want).safeTransfer(owner(), amount);
        }
        emit Withdraw(amount);
    }

    function harvest() public virtual override {}

    function sendYieldFee(uint256 liquidity) internal returns (uint256 fee) {
        (address feeReceiver, uint256 yieldFee) = feeConf.getConfig("yield_fee");

        fee = (liquidity * yieldFee) / PercentBase;
        if (fee > 0) {
            IERC20(want).safeTransfer(feeReceiver, fee);
        }
    }
}
