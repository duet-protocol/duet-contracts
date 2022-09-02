//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/IController.sol";
import "./interfaces/IDUSD.sol";
import "./interfaces/IDYToken.sol";
import "./interfaces/IDusdMinter.sol";
import "./interfaces/ILiquidateCallee.sol";
import "./interfaces/IRouter02.sol";

import "./interfaces/IPair.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract LiquidateDpp is ILiquidateCallee, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public controller;
    address public dusd;
    IRouter02 router;

    address public bUSD;
    address public minter;
    uint256 public leftLimit;

    mapping(address => bool) public isV2Lp;
    mapping(address => bool) public isV3Lp;
    mapping(address => bool) public liquidator;
    mapping(address => address) public forBridge;

    address public balanceReceiver;

    constructor() {}

    function initialize(
        address _controller,
        address _dusd,
        address _router,
        address _bUSD,
        address _minter
    ) external initializer {
        OwnableUpgradeable.__Ownable_init();

        controller = _controller;
        dusd = _dusd;

        router = IRouter02(_router);
        bUSD = _bUSD;
        minter = _minter;

        leftLimit = 100e18;
        IERC20Upgradeable(_bUSD).safeIncreaseAllowance(_minter, type(uint256).max);

        liquidator[msg.sender] = true;

        // CAKE_DUET LP

        isV2Lp[address(0xbDF0aA1D1985Caa357A6aC6661D838DA8691c569)] = true;
        // DUET_DUSD_LP
        isV2Lp[address(0x33C8Fb945d71746f448579559Ea04479a23dFF17)] = true;
        // DUET_WBNB_LP
        isV2Lp[address(0x27027Ef46202B0ff4D091E4bEd5685295aFbD98B)] = true;
        // DUSD_BUSD_LP
        isV2Lp[address(0x4124A6dF3989834c6aCbEe502b7603d4030E18eC)] = true;
        // CAKE_WBNB_LP
        isV2Lp[address(0x0eD7e52944161450477ee417DE9Cd3a859b14fD0)] = true;
        // BTCB_ETH_LP
        isV2Lp[address(0xD171B26E4484402de70e3Ea256bE5A2630d7e88D)] = true;
        // USDC_USDT_LP
        isV2Lp[address(0xEc6557348085Aa57C72514D67070dC863C0a5A8c)] = true;
        // USDT_BUSD_LP
        isV2Lp[address(0x7EFaEf62fDdCCa950418312c6C91Aef321375A00)] = true;

        // forBridge
        // DUET -> CAKE
        forBridge[address(0x95EE03e1e2C5c4877f9A298F1C0D6c98698FAB7B)] = address(
            0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
        );

        // CAKE -> BUSD
        forBridge[address(0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82)] = address(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        );
        // USDT -> BUSD
        forBridge[address(0x55d398326f99059fF775485246999027B3197955)] = address(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        );
        // WBNB -> BUSD
        forBridge[address(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c)] = address(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        );
        // ETH -> WBNB
        forBridge[address(0x2170Ed0880ac9A755fd29B2688956BD959F933F8)] = address(
            0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
        );
        // BTCB -> BUSD
        forBridge[address(0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c)] = address(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        );
        // USDC -> BUSD
        forBridge[address(0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d)] = address(
            0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
        );

        balanceReceiver = owner();
    }

    function setNewRouter(address _newRouter) external onlyOwner {
        router = IRouter02(_newRouter);
    }

    function approveToken(address[] memory tokens, address[] memory targets) external onlyOwner {
        require(tokens.length == targets.length, "mismatch length");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20Upgradeable(tokens[i]).safeIncreaseAllowance(targets[i], type(uint256).max);
        }
    }

    modifier onlyLiquidator() {
        require(liquidator[tx.origin], "Invalid caller");
        _;
    }

    modifier onlyVault() {
        (, , , , , bool enableLiquidate) = IController(controller).vaultStates(msg.sender);
        require(enableLiquidate, "Vault Only");
        _;
    }

    function liquidate(address _borrower, bytes calldata data) external onlyLiquidator {
        IController(controller).liquidate(_borrower, data);

        // transfer extra left dusd balance
        // eg:
        // 500>200, transfer out 300, left 200
        // 300>200,  transfer out 150,left 150
        uint256 leftBalance = IERC20Upgradeable(dusd).balanceOf(address(this));

        if (leftBalance > leftLimit) {
            if (leftBalance / 2 < leftLimit) {
                IERC20Upgradeable(dusd).safeTransfer(balanceReceiver, leftBalance / 2);
            } else {
                IERC20Upgradeable(dusd).safeTransfer(balanceReceiver, leftBalance - leftLimit);
            }
        }
    }

    function setLiquidator(address _liquidator, bool enable) external onlyOwner {
        liquidator[_liquidator] = enable;
    }

    function setLeftLimit(uint256 limit) external onlyOwner {
        leftLimit = limit;
    }

    function setV2Lp(address pair, bool isv2) external onlyOwner {
        isV2Lp[pair] = isv2;
    }

    function addV2Lps(address[] memory pairs) external onlyOwner {
        for (uint256 i = 0; i < pairs.length; i++) {
            isV2Lp[pairs[i]] = true;
        }
    }

    function setBridge(address token, address bridge) external onlyOwner {
        forBridge[token] = bridge;
    }

    function execTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public payable onlyOwner returns (bool success) {
        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (success, ) = target.call{ value: value }(callData);
    }

    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20Upgradeable(token).safeTransfer(owner(), amount);
    }

    function withdrawEth(uint256 amount) external onlyOwner {
        (bool success, ) = owner().call{ value: amount }(new bytes(0));
        require(success, "safeTransferETH: ETH transfer failed");
    }

    function approveTokenIfNeeded(
        address token,
        address spender,
        uint256 amount
    ) private {
        uint256 allowed = IERC20Upgradeable(token).allowance(address(this), spender);
        if (allowed == 0) {
            IERC20Upgradeable(token).safeApprove(spender, type(uint256).max);
        } else if (allowed < amount) {
            IERC20Upgradeable(token).safeIncreaseAllowance(spender, type(uint256).max - allowed);
        }
    }

    function swap(address token0, address token1) public onlyLiquidator returns (uint256 output) {
        uint256 balance = IERC20Upgradeable(token0).balanceOf(address(this));
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;

        approveTokenIfNeeded(token0, address(router), balance);
        uint256[] memory amounts = router.swapExactTokensForTokens(balance, 0, path, address(this), block.timestamp);
        output = amounts[amounts.length - 1];
    }

    function swapForExactOut(
        uint256 amountOut,
        address token0,
        address token1
    ) public onlyLiquidator returns (uint256 input) {
        // swap token for exact token1 amount
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;

        approveTokenIfNeeded(token0, address(router), 0);
        uint256[] memory amounts = router.swapTokensForExactTokens(
            amountOut,
            type(uint256).max,
            path,
            address(this),
            block.timestamp
        ); //todo slippage
        input = amounts[0];
    }

    function convert(address token) public onlyLiquidator returns (uint256 output) {
        uint256 balance = IERC20Upgradeable(token).balanceOf(address(this));
        if (token == dusd) {
            output = balance;
        } else if (token == bUSD) {
            output = IDusdMinter(minter).mineDusd(balance, 0, address(this));
        } else if (forBridge[token] != address(0)) {
            address target = forBridge[token];
            swap(token, target);
            output = convert(target);
        } else {
            output = swap(token, dusd);
        }
    }

    function liquidateDeposit(
        address borrower,
        address underlying,
        uint256 amount,
        bytes calldata data
    ) external override onlyVault {
        IDYToken(underlying).withdraw(address(this), amount, false);
        address under = IDYToken(underlying).underlying();

        if (isV2Lp[under]) {
            IPair pair = IPair(under);
            IERC20Upgradeable(under).safeTransfer(under, pair.balanceOf(address(this)));

            pair.burn(address(this));
            address token0 = pair.token0();
            address token1 = pair.token1();

            if (forBridge[token0] == token1) {
                swap(token0, token1);
                convert(token1);
            } else if (forBridge[token1] == token0) {
                swap(token1, token0);
                convert(token0);
            } else {
                convert(token0);
                convert(token1);
            }
        } else if (isV3Lp[under]) {} else {
            convert(under);
        }
    }

    function liquidateBorrow(
        address borrower,
        address underlying,
        uint256 amount,
        bytes calldata data
    ) external override onlyVault {
        // msg.sender is vault
        approveTokenIfNeeded(underlying, msg.sender, amount);

        if (underlying != dusd) {
            swapForExactOut(amount, dusd, underlying); 
        }
    }

    function setBalanceReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != balanceReceiver, "Same receiver");
        require(newReceiver != address(0), "Invalid receiver");

        balanceReceiver = newReceiver;
    }
}
