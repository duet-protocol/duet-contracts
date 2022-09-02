/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {Storage} from "./Storage.sol";
import {Pricing} from "./Pricing.sol";


/**
 * @title Trader
 * @author DODO Breeder
 *
 * @notice Functions for trader operations
 */
contract QueryTrader is Storage, Pricing{
    using SafeMath for uint256;

    function _querySellBaseToken(uint256 amount)
        internal
        view
        returns (
            uint256 receiveQuote,
            uint256 lpFeeQuote,
            uint256 mtFeeQuote,
            RStatus newRStatus,
            uint256 newQuoteTarget,
            uint256 newBaseTarget
        )
    {
        (newBaseTarget, newQuoteTarget) = getExpectedTarget();

        uint256 sellBaseAmount = amount;

        if (_R_STATUS_ == RStatus.ONE) {
            // case 1: R=1
            // R falls below one
            receiveQuote = _ROneSellBaseToken(sellBaseAmount, newQuoteTarget);
            newRStatus = RStatus.BELOW_ONE;
        } else if (_R_STATUS_ == RStatus.ABOVE_ONE) {
            uint256 backToOnePayBase = newBaseTarget.sub(_BASE_BALANCE_);
            uint256 backToOneReceiveQuote = _QUOTE_BALANCE_.sub(newQuoteTarget);
            // case 2: R>1
            // complex case, R status depends on trading amount
            if (sellBaseAmount < backToOnePayBase) {
                // case 2.1: R status do not change
                receiveQuote = _RAboveSellBaseToken(sellBaseAmount, _BASE_BALANCE_, newBaseTarget);
                newRStatus = RStatus.ABOVE_ONE;
                if (receiveQuote > backToOneReceiveQuote) {
                    // [Important corner case!] may enter this branch when some precision problem happens. And consequently contribute to negative spare quote amount
                    // to make sure spare quote>=0, mannually set receiveQuote=backToOneReceiveQuote
                    receiveQuote = backToOneReceiveQuote;
                }
            } else if (sellBaseAmount == backToOnePayBase) {
                // case 2.2: R status changes to ONE
                receiveQuote = backToOneReceiveQuote;
                newRStatus = RStatus.ONE;
            } else {
                // case 2.3: R status changes to BELOW_ONE
                receiveQuote = backToOneReceiveQuote.add(
                    _ROneSellBaseToken(sellBaseAmount.sub(backToOnePayBase), newQuoteTarget)
                );
                newRStatus = RStatus.BELOW_ONE;
            }
        } else {
            // _R_STATUS_ == Types.RStatus.BELOW_ONE
            // case 3: R<1
            receiveQuote = _RBelowSellBaseToken(sellBaseAmount, _QUOTE_BALANCE_, newQuoteTarget);
            newRStatus = RStatus.BELOW_ONE;
        }

        // count fees
        lpFeeQuote = DecimalMath.mul(receiveQuote, _LP_FEE_RATE_);
        mtFeeQuote = DecimalMath.mul(receiveQuote, _MT_FEE_RATE_);
        receiveQuote = receiveQuote.sub(lpFeeQuote).sub(mtFeeQuote);

        return (receiveQuote, lpFeeQuote, mtFeeQuote, newRStatus, newQuoteTarget, newBaseTarget);
    }

    function _queryBuyBaseToken(uint256 amount)
        internal
        view
        returns (
            uint256 payQuote,
            uint256 lpFeeBase,
            uint256 mtFeeBase,
            RStatus newRStatus,
            uint256 newQuoteTarget,
            uint256 newBaseTarget
        )
    {
        (newBaseTarget, newQuoteTarget) = getExpectedTarget();

        // charge fee from user receive amount
        lpFeeBase = DecimalMath.mul(amount, _LP_FEE_RATE_);
        mtFeeBase = DecimalMath.mul(amount, _MT_FEE_RATE_);
        uint256 buyBaseAmount = amount.add(lpFeeBase).add(mtFeeBase);

        if (_R_STATUS_ == RStatus.ONE) {
            // case 1: R=1
            payQuote = _ROneBuyBaseToken(buyBaseAmount, newBaseTarget);
            newRStatus = RStatus.ABOVE_ONE;
        } else if (_R_STATUS_ == RStatus.ABOVE_ONE) {
            // case 2: R>1
            payQuote = _RAboveBuyBaseToken(buyBaseAmount, _BASE_BALANCE_, newBaseTarget);
            newRStatus = RStatus.ABOVE_ONE;
        } else if (_R_STATUS_ == RStatus.BELOW_ONE) {
            uint256 backToOnePayQuote = newQuoteTarget.sub(_QUOTE_BALANCE_);
            uint256 backToOneReceiveBase = _BASE_BALANCE_.sub(newBaseTarget);
            // case 3: R<1
            // complex case, R status may change
            if (buyBaseAmount < backToOneReceiveBase) {
                // case 3.1: R status do not change
                // no need to check payQuote because spare base token must be greater than zero
                payQuote = _RBelowBuyBaseToken(buyBaseAmount, _QUOTE_BALANCE_, newQuoteTarget);
                newRStatus = RStatus.BELOW_ONE;
            } else if (buyBaseAmount == backToOneReceiveBase) {
                // case 3.2: R status changes to ONE
                payQuote = backToOnePayQuote;
                newRStatus = RStatus.ONE;
            } else {
                // case 3.3: R status changes to ABOVE_ONE
                payQuote = backToOnePayQuote.add(
                    _ROneBuyBaseToken(buyBaseAmount.sub(backToOneReceiveBase), newBaseTarget)
                );
                newRStatus = RStatus.ABOVE_ONE;
            }
        }

        return (payQuote, lpFeeBase, mtFeeBase, newRStatus, newQuoteTarget, newBaseTarget);
    }
}
