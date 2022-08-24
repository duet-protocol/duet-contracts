// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IPair.sol";
import "../interfaces/IMasterChef.sol";
import "../interfaces/IRouter02.sol";

import "./BaseStrategy.sol";

// 1. stake Pancake lp earn cake.
// 2. cake to lp
contract StrategyForPancakeLP is BaseStrategy {
    using SafeERC20 for IERC20;

    address public immutable router;
    // bsc: 0x73feaa1ee314f8c655e354234017be2193c9e24e
    address public immutable masterChef;

    uint256 public immutable pid;

    address public immutable token0;
    address public immutable token1;

    address[] public outputToToken0Path;
    address[] public outputToToken1Path;

    constructor(
        address _controller,
        address _fee,
        address _want,
        address _router,
        address _master,
        uint256 _pid
    ) BaseStrategy(_controller, _fee, _want, IMasterChef(_master).cake()) {
        router = _router;
        masterChef = _master;
        pid = _pid;

        token0 = IPair(_want).token0();
        token1 = IPair(_want).token1();

        outputToToken0Path = [output, token0];
        outputToToken1Path = [output, token1];

        doApprove();
    }

    function doApprove() public {
        IERC20(token0).safeApprove(router, 0);
        IERC20(token0).safeApprove(router, type(uint256).max);
        IERC20(token1).safeApprove(router, 0);
        IERC20(token1).safeApprove(router, type(uint256).max);

        IERC20(output).safeApprove(router, 0);
        IERC20(output).safeApprove(router, type(uint256).max);
        IERC20(want).safeApprove(masterChef, 0);
        IERC20(want).safeApprove(masterChef, type(uint256).max);
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
            IMasterChef(masterChef).deposit(pid, dAmount); // receive pending cake.
            emit Deposit(dAmount);
        }

        doHarvest();
    }

    // yield
    function harvest() public virtual override {
        IMasterChef(masterChef).deposit(pid, 0);
        doHarvest();
    }

    // only call from dToken
    function withdraw(uint256 _amount) external virtual override {
        address dToken = IController(controller).dyTokens(want);
        require(msg.sender == dToken, "invalid caller");

        uint256 dAmount = IERC20(want).balanceOf(address(this));
        if (dAmount < _amount) {
            IMasterChef(masterChef).withdraw(pid, _amount - dAmount);
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
        IMasterChef(masterChef).withdraw(pid, b);

        uint256 balance = IERC20(want).balanceOf(address(this));
        IERC20(want).safeTransfer(dToken, balance);
        emit Withdraw(balance);

        // May left a little output token, let's send to Yield Fee Receiver.
        uint256 cakeBalance = IERC20(output).balanceOf(address(this));
        (address feeReceiver, ) = feeConf.getConfig("yield_fee");
        IERC20(output).safeTransfer(feeReceiver, cakeBalance);
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
            IRouter02(router).swapExactTokensForTokens(
                cakeBalance / 2,
                0,
                outputToToken0Path,
                address(this),
                block.timestamp
            );
            IRouter02(router).swapExactTokensForTokens(
                cakeBalance / 2,
                0,
                outputToToken1Path,
                address(this),
                block.timestamp
            );

            uint256 token0Amount = IERC20(token0).balanceOf(address(this));
            uint256 token1Amount = IERC20(token1).balanceOf(address(this));

            (, , uint256 liquidity) = IRouter02(router).addLiquidity(
                token0,
                token1,
                token0Amount,
                token1Amount,
                0,
                0,
                address(this),
                block.timestamp
            );

            uint256 fee = sendYieldFee(liquidity);
            uint256 hAmount = liquidity - fee;

            IMasterChef(masterChef).deposit(pid, hAmount);
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

    function setToken0Path(address[] memory _path) public onlyOwner {
        outputToToken0Path = _path;
    }

    function setToken1Path(address[] memory _path) public onlyOwner {
        outputToToken1Path = _path;
    }
}
