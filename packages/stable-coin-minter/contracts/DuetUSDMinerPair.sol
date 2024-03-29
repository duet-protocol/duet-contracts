//SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import { IERC2612 } from "@openzeppelin/contracts/interfaces/draft-IERC2612.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./libs/TransferHelper.sol";
import "./interfaces/TokenRecipient.sol";
import "./interfaces/IDUSD.sol";

import "./interfaces/IUSDOracle.sol";

// Virtual Amm: x^2 = k
contract DuetUSDMinerPair is Ownable, TokenRecipient {
    uint256 constant PERCENT_BASE = 10000;
    uint256 constant VALID_STABLE_PRICE = 98000000; // 0.98 usd;

    uint256 public feePercent = 20; // 0.2%
    uint256 public redeemPercent = 5000; // 50%

    address public feeTo;
    address public immutable dusd;
    address public immutable stableToken;
    IUSDOracle public stableOracle;
    uint256 public reserve;

    event Mint(address indexed user, uint256 stableAmount, uint256 amount);
    event Burn(address indexed user, uint256 stableAmount, uint256 amount);

    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "DuetUSDMinerPair: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor(address _stableToken, IUSDOracle _stableOracle, address _dusd, address _feeTo) {
        require(IERC20Metadata(_stableToken).decimals() == 18, "not support stable token");
        stableToken = _stableToken;
        stableOracle = _stableOracle;
        dusd = _dusd;
        reserve = 50000000e18;
        feeTo = _feeTo;
    }

    function updateOracle(IUSDOracle _stableOracle) external onlyOwner {
        require(address(_stableOracle) != address(0), "invalid oracle");
        stableOracle = _stableOracle;
    }

    function setFeeTo(address _feeTo) external onlyOwner {
        feeTo = _feeTo;
    }

    function updateFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 500, "fee too high");
        feePercent = _feePercent;
    }

    function updateRedeemPercent(uint256 _redeemPercent) external onlyOwner {
        require(_redeemPercent <= PERCENT_BASE, "invalid redeem percent");
        redeemPercent = _redeemPercent;
    }

    function updateVirtualReserve(uint256 _reserve) external onlyOwner {
        require(_reserve >= IERC20(stableToken).balanceOf(address(this)), "virtual reserve must >= real reserve");
        reserve = _reserve;
    }

    // for update, reuse stable etc.
    function approve(address to, uint256 value) external onlyOwner {
        TransferHelper.safeApprove(stableToken, to, value);
    }

    // function permitMineDuet(uint amount, uint minDusd, address to, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
    //   IERC2612(stableToken).permit(msg.sender, address(this), amount, deadline, v, r, s);
    //   mine(amount, minDusd, to);
    // }

    function mineDusd(uint256 amount, uint256 minDusd, address to) public lock returns (uint256 amountOut) {
        require(amount > 0, "invalid amount");
        require(stableOracle.getPrice(stableToken) > VALID_STABLE_PRICE, "stable token value too low");
        uint256 fee = 0;
        (amountOut, fee) = calcOutputFee(amount);

        require(amountOut >= minDusd, "insufficient output amount");
        reserve = reserve + amount;

        TransferHelper.safeTransferFrom(stableToken, msg.sender, address(this), amount);
        if (fee > 0) {
            TransferHelper.safeTransfer(stableToken, feeTo, fee);
        }

        IDUSD(dusd).mint(to, amountOut);
        emit Mint(to, amount, amountOut);
    }

    // test ok
    function calcOutputFee(uint256 amount) public view returns (uint256 amountOut, uint256 fee) {
        amountOut = (amount * reserve) / (reserve + amount);
        fee = feePercent > 0 ? (amount * feePercent) / PERCENT_BASE : 0;

        if (amount - amountOut < fee) {
            amountOut = amount - fee;
        } else {
            fee = amount - amountOut;
        }
    }

    function calcInputFee(uint256 amountOut) public view returns (uint256 amountIn, uint256 fee) {
        amountIn = ((reserve * amountOut) / (reserve - amountOut)) + 1;
        fee = feePercent > 0 ? (amountIn * feePercent) / PERCENT_BASE : 0;
        if (amountIn - amountOut < fee) {
            amountIn = (amountOut * PERCENT_BASE) / (PERCENT_BASE - feePercent);
            if ((PERCENT_BASE - feePercent) * amountIn != amountOut * PERCENT_BASE) {
                amountIn += 1;
            }
            fee = amountIn - amountOut;
        } else {
            fee = amountIn - amountOut;
        }
    }

    function tokensReceived(address from, uint256 amount, bytes calldata exData) external override returns (bool) {
        require(msg.sender == dusd, "must call from dusd");
        if (exData.length > 0) {
            doBurnDusd(amount, bytesToUint(exData), from);
        } else {
            doBurnDusd(amount, 0, from);
        }

        return true;
    }

    function permitBurnDusd(
        uint256 amount,
        uint256 minStable,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountOut) {
        IERC2612(dusd).permit(msg.sender, address(this), amount, deadline, v, r, s);
        amountOut = burnDusd(amount, minStable, to);
    }

    function burnDusd(uint256 amount, uint256 minStable, address to) public returns (uint256 amountOut) {
        TransferHelper.safeTransferFrom(dusd, msg.sender, address(this), amount);
        amountOut = doBurnDusd(amount, minStable, to);
    }

    function doBurnDusd(uint256 amount, uint256 minStable, address to) internal lock returns (uint256 amountOut) {
        require(amount > 0, "invalid amount");
        uint256 fee = 0;
        (amountOut, fee) = calcOutputFee(amount);

        require(amountOut >= minStable, "insufficient output amount");
        require(checkUnderRedeemLimit(amountOut), "insufficient liquidity");

        reserve = reserve - amount;
        IDUSD(dusd).burn(amount);

        TransferHelper.safeTransfer(stableToken, to, amountOut);

        if (fee > 0 && feeTo != address(0)) {
            TransferHelper.safeTransfer(stableToken, feeTo, fee);
        }

        emit Burn(to, amountOut, amount);
    }

    function checkUnderRedeemLimit(uint256 amount) public view returns (bool) {
        uint256 redeemLimit = (IERC20(stableToken).balanceOf(address(this)) * redeemPercent) / PERCENT_BASE;
        return amount <= redeemLimit;
    }

    function bytesToUint(bytes calldata b) internal pure returns (uint256) {
        uint256 number;
        for (uint256 i = 0; i < b.length; i++) {
            number = number + uint8(b[i]) * (2 ** (8 * (b.length - (i + 1))));
        }
        return number;
    }
}
