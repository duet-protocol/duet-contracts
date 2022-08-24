// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import { UniversalERC20 } from "./lib/UniversalERC20.sol";
import { SafeERC20 } from "./lib/SafeERC20.sol";
import { DecimalMath } from "./lib/DecimalMath.sol";
import { ReentrancyGuard } from "./lib/ReentrancyGuard.sol";
import { SafeMath } from "./lib/SafeMath.sol";
import { IDODOV2 } from "./interfaces/IDODOV2.sol";
import { IDPPOracleAdmin } from "./interfaces/IDPPOracleAdmin.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { IWETH } from "./interfaces/IWETH.sol";
import { Adminable } from "./lib/Adminable.sol";
import { DuetDppLpFunding } from "./DuetDppLpFunding.sol";

contract DuetDppController is Adminable, DuetDppLpFunding {
    using SafeMath for uint256;
    using UniversalERC20 for IERC20;
    using SafeERC20 for IERC20;

    address public _WETH_;
    bool flagInit = false;

    /** 主要用于frontrun保护，当项目方发起交易，修改池子参数时，可能会造成池子的价格改变，
     * 这时候机器人可能会frontrun套利，因此这两个参数设定后，
     * 当执行时池子现存的base，quote的数量小于传入的值，reset交易会revert，防止被套利 **/
    uint256 minBaseReserve = 0;
    uint256 minQuoteReserve = 0;

    modifier judgeExpired(uint256 deadLine) {
        require(deadLine >= block.timestamp, "DODOV2Proxy02: EXPIRED");
        _;
    }

    modifier notInitialized() {
        require(flagInit == false, "have been initialized");
        flagInit = true;
        _;
    }

    fallback() external payable {}

    receive() external payable {}

    function init(
        address admin,
        address dppAddress,
        address dppAdminAddress,
        address weth
    ) external notInitialized {
        // 改init
        _WETH_ = weth;
        _DPP_ADDRESS_ = dppAddress;
        _DPP_ADMIN_ADDRESS_ = dppAdminAddress;
        _setAdmin(admin);

        // load pool info
        _BASE_TOKEN_ = IERC20(IDODOV2(_DPP_ADDRESS_)._BASE_TOKEN_());
        _QUOTE_TOKEN_ = IERC20(IDODOV2(_DPP_ADDRESS_)._QUOTE_TOKEN_());
        _updateDppInfo();

        string memory connect = "_";
        string memory suffix = "Duet";

        name = string(abi.encodePacked(suffix, connect, addressToShortString(address(this))));
        symbol = "Duet_LP";
        decimals = _BASE_TOKEN_.decimals();

        // ============================== Permit ====================================
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                // keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f,
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
        // ==========================================================================
    }

    // ========= change DPP Oracle and Parameters , onlyAdmin ==========
    function tunePrice(
        uint256 newI,
        uint256 minBaseReserve_,
        uint256 minQuoteReserve_
    ) external onlyAdmin returns (bool) {
        IDPPOracleAdmin(_DPP_ADMIN_ADDRESS_).tunePrice(newI, minBaseReserve_, minQuoteReserve_);
        _updateDppInfo();
        return true;
    }

    function tuneParameters(
        uint256 newLpFeeRate,
        uint256 newI,
        uint256 newK,
        uint256 minBaseReserve_,
        uint256 minQuoteReserve_
    ) external onlyAdmin returns (bool) {
        IDPPOracleAdmin(_DPP_ADMIN_ADDRESS_).tuneParameters(
            newLpFeeRate,
            newI,
            newK,
            minBaseReserve_,
            minQuoteReserve_
        );
        _updateDppInfo();
        return true;
    }

    function changeOracle(address newOracle) external onlyAdmin {
        IDPPOracleAdmin(_DPP_ADMIN_ADDRESS_).changeOracle(newOracle);
    }

    function enableOracle() external onlyAdmin {
        IDPPOracleAdmin(_DPP_ADMIN_ADDRESS_).enableOracle();
    }

    function disableOracle(uint256 newI) external onlyAdmin {
        IDPPOracleAdmin(_DPP_ADMIN_ADDRESS_).disableOracle(newI);
    }

    function changeMinRes(uint256 newBaseR_, uint256 newQuoteR_) external onlyAdmin {
        minBaseReserve = newBaseR_;
        minQuoteReserve = newQuoteR_;
    }

    // =========== deal with LP ===============

    function addDuetDppLiquidity(
        uint256 baseInAmount,
        uint256 quoteInAmount,
        uint256 baseMinAmount,
        uint256 quoteMinAmount,
        uint8 flag, // 0 - ERC20, 1 - baseInETH, 2 - quoteInETH
        uint256 deadLine
    )
        external
        payable
        preventReentrant
        judgeExpired(deadLine)
        returns (
            uint256 shares,
            uint256 baseAdjustedInAmount,
            uint256 quoteAdjustedInAmount
        )
    {
        (baseAdjustedInAmount, quoteAdjustedInAmount) = _adjustedAddLiquidityInAmount(baseInAmount, quoteInAmount);
        require(
            baseAdjustedInAmount >= baseMinAmount && quoteAdjustedInAmount >= quoteMinAmount,
            "Duet Dpp Controller: deposit amount is not enough"
        );

        _deposit(msg.sender, _DPP_ADDRESS_, IDODOV2(_DPP_ADDRESS_)._BASE_TOKEN_(), baseAdjustedInAmount, flag == 1);
        _deposit(msg.sender, _DPP_ADDRESS_, IDODOV2(_DPP_ADDRESS_)._QUOTE_TOKEN_(), quoteAdjustedInAmount, flag == 2);

        //mint lp tokens to users

        (shares, , ) = _buyShares(msg.sender);
        // reset dpp pool
        require(
            IDODOV2(IDODOV2(_DPP_ADDRESS_)._OWNER_()).reset(
                address(this),
                _LP_FEE_RATE_,
                _I_,
                _K_,
                0,
                0,
                minBaseReserve, // minBaseReserve
                minQuoteReserve // minQuoteReserve
            ),
            "Reset Failed"
        );

        // refund dust eth
        if (flag == 1 && msg.value > baseAdjustedInAmount) {
            payable(msg.sender).transfer(msg.value - baseAdjustedInAmount);
        }
        if (flag == 2 && msg.value > quoteAdjustedInAmount) {
            payable(msg.sender).transfer(msg.value - quoteAdjustedInAmount);
        }
    }

    function removeDuetDppLiquidity(
        uint256 shareAmount,
        uint256 baseMinAmount,
        uint256 quoteMinAmount,
        uint8 flag, // 0 - ERC20, 1 - baseInETH, 2 - quoteInETH, 3 - baseOutETH, 4 - quoteOutETH
        uint256 deadLine
    )
        external
        preventReentrant
        judgeExpired(deadLine)
        returns (
            uint256 shares,
            uint256 baseOutAmount,
            uint256 quoteOutAmount
        )
    {
        //mint lp tokens to users
        (baseOutAmount, quoteOutAmount) = _sellShares(shareAmount, msg.sender, baseMinAmount, quoteMinAmount);
        // reset dpp pool
        require(
            IDODOV2(IDODOV2(_DPP_ADDRESS_)._OWNER_()).reset(
                address(this),
                _LP_FEE_RATE_,
                _I_,
                _K_,
                baseOutAmount,
                quoteOutAmount,
                minBaseReserve, //minBaseReserve,
                minQuoteReserve //minQuoteReserve
            ),
            "Reset Failed"
        );

        _withdraw(payable(msg.sender), IDODOV2(_DPP_ADDRESS_)._BASE_TOKEN_(), baseOutAmount, flag == 3);
        _withdraw(payable(msg.sender), IDODOV2(_DPP_ADDRESS_)._QUOTE_TOKEN_(), quoteOutAmount, flag == 4);
        shares = shareAmount;
    }

    function _adjustedAddLiquidityInAmount(uint256 baseInAmount, uint256 quoteInAmount)
        internal
        view
        returns (uint256 baseAdjustedInAmount, uint256 quoteAdjustedInAmount)
    {
        (uint256 baseReserve, uint256 quoteReserve) = IDODOV2(_DPP_ADDRESS_).getVaultReserve();
        if (quoteReserve == 0 && baseReserve == 0) {
            require(msg.sender == admin, "Must initialized by admin");
            // Must initialized by admin
            baseAdjustedInAmount = baseInAmount;
            quoteAdjustedInAmount = quoteInAmount;
        }
        if (quoteReserve == 0 && baseReserve > 0) {
            baseAdjustedInAmount = baseInAmount;
            quoteAdjustedInAmount = 0;
        }
        if (quoteReserve > 0 && baseReserve > 0) {
            uint256 baseIncreaseRatio = DecimalMath.divFloor(baseInAmount, baseReserve);
            uint256 quoteIncreaseRatio = DecimalMath.divFloor(quoteInAmount, quoteReserve);
            if (baseIncreaseRatio <= quoteIncreaseRatio) {
                baseAdjustedInAmount = baseInAmount;
                quoteAdjustedInAmount = DecimalMath.mulFloor(quoteReserve, baseIncreaseRatio);
            } else {
                quoteAdjustedInAmount = quoteInAmount;
                baseAdjustedInAmount = DecimalMath.mulFloor(baseReserve, quoteIncreaseRatio);
            }
        }
    }

    // ================= internal ====================

    function _updateDppInfo() internal {
        _LP_FEE_RATE_ = IDODOV2(_DPP_ADDRESS_)._LP_FEE_RATE_();
        _K_ = IDODOV2(_DPP_ADDRESS_)._K_();
        _I_ = IDODOV2(_DPP_ADDRESS_)._I_();
    }

    function _deposit(
        address from,
        address to,
        address token,
        uint256 amount,
        bool isETH
    ) internal {
        if (isETH) {
            if (amount > 0) {
                require(msg.value >= amount, "ETH_VALUE_WRONG");
                // case:msg.value > adjustAmount
                IWETH(_WETH_).deposit{ value: amount }();
                if (to != address(this)) SafeERC20.safeTransfer(IERC20(_WETH_), to, amount);
            }
        } else {
            if (amount > 0) {
                IERC20(token).safeTransferFrom(from, to, amount);
            }
        }
    }

    function _withdraw(
        address payable to,
        address token,
        uint256 amount,
        bool isETH
    ) internal {
        if (isETH) {
            if (amount > 0) {
                IWETH(_WETH_).withdraw(amount);
                to.transfer(amount);
            }
        } else {
            if (amount > 0) {
                SafeERC20.safeTransfer(IERC20(token), to, amount);
            }
        }
    }

    // =================================================

    function addressToShortString(address _addr) public pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(8);
        for (uint256 i = 0; i < 4; i++) {
            str[i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[1 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
