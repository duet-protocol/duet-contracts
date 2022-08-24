// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPair.sol";
import "../interfaces/IMasterChef.sol";
import "../interfaces/IRouter02.sol";

import "./BaseStrategy.sol";

// stake Cake earn cake.
contract StrategyForCake is BaseStrategy {
    using SafeERC20 for IERC20;

    address public immutable masterChef;
    uint256 public constant pid = 0;

    constructor(
        address _controller,
        address _fee,
        address _master
    ) BaseStrategy(_controller, _fee, IMasterChef(_master).cake(), IMasterChef(_master).cake()) {
        masterChef = _master;
        IERC20(output).safeApprove(masterChef, type(uint256).max);
    }

    function balanceOfPool() public view virtual override returns (uint256) {
        (uint256 amount, ) = IMasterChef(masterChef).userInfo(pid, address(this));
        return amount;
    }

    function pendingOutput() external view virtual override returns (uint256) {
        return IMasterChef(masterChef).pendingCake(pid, address(this));
    }

    function deposit() public virtual override {
        uint256 dAmount = IERC20(want).balanceOf(address(this));
        if (dAmount > 0) {
            IMasterChef(masterChef).enterStaking(dAmount); // receive pending cake.
            emit Deposit(dAmount);
        }

        doHarvest();
    }

    // yield
    function harvest() public virtual override {
        IMasterChef(masterChef).enterStaking(0);
        doHarvest();
    }

    // only call from dToken
    function withdraw(uint256 _amount) external virtual override {
        address dToken = IController(controller).dyTokens(want);
        require(msg.sender == dToken, "invalid caller");

        uint256 dAmount = IERC20(want).balanceOf(address(this));
        if (dAmount < _amount) {
            IMasterChef(masterChef).leaveStaking(_amount - dAmount);
        }

        safeTransfer(want, dToken, _amount); // lp transfer to dToken
        emit Withdraw(_amount);
        doHarvest();
    }

    // should used for reset strategy
    function withdrawAll() external virtual override returns (uint256 balance) {
        address dToken = IController(controller).dyTokens(want);
        require(msg.sender == controller || msg.sender == dToken, "invalid caller");

        doHarvest();
        uint256 b = balanceOfPool();
        IMasterChef(masterChef).leaveStaking(b);

        uint256 balance = IERC20(want).balanceOf(address(this));
        IERC20(want).safeTransfer(dToken, balance);
        emit Withdraw(balance);
    }

    function emergency() external override onlyOwner {
        IMasterChef(masterChef).emergencyWithdraw(pid);

        uint256 amount = IERC20(want).balanceOf(address(this));
        address dToken = IController(controller).dyTokens(want);

        if (dToken != address(0)) {
            IERC20(want).safeTransfer(dToken, amount);
        } else {
            IERC20(want).safeTransfer(owner(), amount);
        }
        emit Withdraw(amount);
    }

    function doHarvest() internal virtual {
        uint256 cakeBalance = IERC20(output).balanceOf(address(this));
        if (cakeBalance > minHarvestAmount) {
            uint256 fee = sendYieldFee(cakeBalance);
            uint256 hAmount = cakeBalance - fee;

            IMasterChef(masterChef).enterStaking(hAmount);
            emit Harvest(hAmount);
        }
    }

    function sendYieldFee(uint256 liquidity) internal returns (uint256 fee) {
        (address feeReceiver, uint256 yieldFee) = feeConf.getConfig("yield_fee");

        fee = (liquidity * yieldFee) / PercentBase;
        if (fee > 0) {
            IERC20(want).safeTransfer(feeReceiver, fee);
        }
    }
}
