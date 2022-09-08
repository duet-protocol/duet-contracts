/*
    SPDX-License-Identifier: Apache-2.0
*/
pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./lib/Adminable.sol";
import "./lib/Pricing.sol";
import "./interfaces/IDODOV2.sol";

contract DppRouter is Adminable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    mapping(address => mapping(address => address)) public availablePools;
    mapping(address => bool) public availableBaseToken;

    struct PoolInfo {
        address baseToken;
        address quoteToken;
        address pairAddress;
    }

    // ============ modifier ============

    modifier judgeExpired(uint256 deadLine) {
        require(deadLine >= block.timestamp, "dppRouter: expired");
        _;
    }

    constructor(address _admin) public {
        _setAdmin(_admin);
    }

    function setAvailablePools(PoolInfo[] memory _pools) public onlyAdmin {
        for (uint256 i = 0; i < _pools.length; ++i) {
            availablePools[_pools[i].baseToken][_pools[i].quoteToken] = _pools[i].pairAddress;
        }
    }

    function setAvailableBaseTokens(address[] calldata _newBaseTokens) public onlyAdmin {
        for(uint256 i = 0 ; i < _newBaseTokens.length; ++i) {
            availableBaseToken[_newBaseTokens[i]] = true;
        }
    }

    function delBaseTokens(address[] calldata _delBaseTokens) public onlyAdmin {
        for(uint256 i = 0 ; i < _delBaseTokens.length; ++i) {
            availableBaseToken[_delBaseTokens[i]] = false;
        }
    }

    function setOneAvailablePool(
        address _baseToken,
        address _quoteToken,
        address _pairAddress
    ) public onlyAdmin {
        availablePools[_baseToken][_quoteToken] = _pairAddress;
    }

    //need out token must be baseToken, busd,usdc
    function swapTokensForExactTokens(
        uint256 _amountOut,
        uint256 _amountInMax,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external judgeExpired(_deadline) returns (uint256[] memory amounts) {
        amounts = new uint[](_path.length);
        address V2pair = _getPairAddr(_path[0], _path[1]);
        // insure base token must be stable coins
        require(availableBaseToken[IDODOV2(V2pair)._BASE_TOKEN_()], "dppRouter: illegel base token query buy base");

        uint256 quoteInAmount = queryBuyBaseToken(_amountOut, V2pair);
        require(quoteInAmount <= _amountInMax, "dppRouter: amount in exceed");
        require(IDODOV2(V2pair)._BASE_RESERVE_() > _amountOut, "dppRouter: amount out exceed");

        IERC20Upgradeable(_path[0]).safeTransferFrom(msg.sender, address(this), quoteInAmount);
        IERC20Upgradeable(_path[0]).safeTransfer(V2pair, quoteInAmount);
        IDODOV2(V2pair).sellQuote(_to);

        amounts[0] = quoteInAmount;
        amounts[_path.length - 1] = querySellQuoteToken(quoteInAmount, V2pair);
    }

    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external judgeExpired(_deadline) returns (uint256[] memory amounts) {
        amounts = new uint[](_path.length);
        amounts[0] = _amountIn;
        address V2pair = _getPairAddr(_path[0], _path[1]);

        if (_path[0] == IDODOV2(V2pair)._BASE_TOKEN_()) {
            // sell base
            uint256 QuoteOutAmount = querySellBaseToken(_amountIn, V2pair);
            amounts[_path.length - 1] = QuoteOutAmount;
            require(QuoteOutAmount >= _amountOutMin, "dppRouter: receive amount not enough");

            IERC20Upgradeable(_path[0]).safeTransferFrom(msg.sender, address(this), _amountIn);
            IERC20Upgradeable(_path[0]).safeTransfer(V2pair, _amountIn);
            IDODOV2(V2pair).sellBase(_to);
        } else if (_path[0] == IDODOV2(V2pair)._QUOTE_TOKEN_()) {
            uint256 BaseOutAmount = querySellQuoteToken(_amountIn, V2pair);
            amounts[_path.length - 1] = BaseOutAmount;
            require(BaseOutAmount >= _amountOutMin, "dppRouter: receive amount not enough");

            IERC20Upgradeable(_path[0]).safeTransferFrom(msg.sender, address(this), _amountIn);
            IERC20Upgradeable(_path[0]).safeTransfer(V2pair, _amountIn);
            IDODOV2(V2pair).sellQuote(_to);
        }
    }

    // ============ Query Functions ============

    function querySellBaseToken(uint256 _amount, address _pair) public view returns (uint256 receiveQuote) {
       (receiveQuote, , , ) =  IDODOV2(_pair).querySellBase(address(this), _amount);
    }

    function querySellQuoteToken(uint256 _amount, address _pair) public view returns (uint256 receiveBase) {
        (receiveBase, , , ) = IDODOV2(_pair).querySellQuote(address(this), _amount);
    }

    function queryBuyBaseToken(uint256 _amount, address _pair) public view returns (uint256 payQuote) {
        Pricing.PMMState memory state = _updatePairDetails(_pair);
        (payQuote, , , , , ) = Pricing._queryBuyBaseToken(state, _amount);
        return payQuote;
    }

    // =========== internal ===============

    function _updatePairDetails(address _V2pair) internal view returns(Pricing.PMMState memory state) {
        uint256 _R_;
        {
        (
            state.i,
            state.K,
            state.B,
            state.Q,
            state.B0,
            state.Q0,
            _R_
        ) = IDODOV2(_V2pair).getPMMStateForCall();
        state.R = Pricing.RStatus(uint32(_R_));
        }

        (state.lpFee, state.mtFee) = IDODOV2(_V2pair).getUserFeeRate(address(this));
    }

    function _getPairAddr(address _sellToken, address _buyToken) internal returns (address V2Pair) {
        V2Pair = availablePools[_sellToken][_buyToken] != address(0)
            ? availablePools[_sellToken][_buyToken]
            : availablePools[_buyToken][_sellToken];
        require(V2Pair != address(0), "dppRouter: no pair");
        return V2Pair;
    }
}
