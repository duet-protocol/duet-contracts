/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import { SafeMath } from "../lib/SafeMath.sol";
import { DecimalMath } from "../lib/DecimalMath.sol";
import { DODOMath } from "../lib/DODOMath.sol";

/**
 * @title Pricing
 * @author DODO Breeder
 *
 * @notice DODO Pricing model
 */
library Pricing {
    using SafeMath for uint256;

    enum RStatus {
        ONE,
        ABOVE_ONE,
        BELOW_ONE
    }

    struct PMMState {
        uint256 i;
        uint256 K;
        uint256 B;
        uint256 Q;
        uint256 B0;
        uint256 Q0;
        RStatus R;
        uint256 lpFee;
        uint256 mtFee;
    }

    function querySellBaseToken(PMMState memory state, uint256 amount)
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
        (newBaseTarget, newQuoteTarget) = getExpectedTarget(state);

        uint256 sellBaseAmount = amount;

        if (state.R == RStatus.ONE) {
            // case 1: R=1
            // R falls below one
            receiveQuote = _ROneSellBaseToken(state, sellBaseAmount, newQuoteTarget);
            newRStatus = RStatus.BELOW_ONE;
        } else if (state.R == RStatus.ABOVE_ONE) {
            uint256 backToOnePayBase = newBaseTarget.sub(state.B);
            uint256 backToOneReceiveQuote = state.Q.sub(newQuoteTarget);
            // case 2: R>1
            // complex case, R status depends on trading amount
            if (sellBaseAmount < backToOnePayBase) {
                // case 2.1: R status do not change
                receiveQuote = _RAboveSellBaseToken(state, sellBaseAmount, state.B, newBaseTarget);
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
                    _ROneSellBaseToken(state, sellBaseAmount.sub(backToOnePayBase), newQuoteTarget)
                );
                newRStatus = RStatus.BELOW_ONE;
            }
        } else {
            // state.R == Types.RStatus.BELOW_ONE
            // case 3: R<1
            receiveQuote = _RBelowSellBaseToken(state, sellBaseAmount, state.Q, newQuoteTarget);
            newRStatus = RStatus.BELOW_ONE;
        }

        // count fees
        lpFeeQuote = DecimalMath.mul(receiveQuote, state.lpFee);
        mtFeeQuote = DecimalMath.mul(receiveQuote, state.mtFee);
        receiveQuote = receiveQuote.sub(lpFeeQuote).sub(mtFeeQuote);

        return (receiveQuote, lpFeeQuote, mtFeeQuote, newRStatus, newQuoteTarget, newBaseTarget);
    }

    function _queryBuyBaseToken(PMMState memory state, uint256 amount)
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
        (newBaseTarget, newQuoteTarget) = getExpectedTarget(state);

        // charge fee from user receive amount
        lpFeeBase = DecimalMath.mul(amount, state.lpFee);
        mtFeeBase = DecimalMath.mul(amount, state.mtFee);
        uint256 buyBaseAmount = amount.add(lpFeeBase).add(mtFeeBase);

        if (state.R == RStatus.ONE) {
            // case 1: R=1
            payQuote = _ROneBuyBaseToken(state, buyBaseAmount, newBaseTarget);
            newRStatus = RStatus.ABOVE_ONE;
        } else if (state.R == RStatus.ABOVE_ONE) {
            // case 2: R>1
            payQuote = _RAboveBuyBaseToken(state, buyBaseAmount, state.B, newBaseTarget);
            newRStatus = RStatus.ABOVE_ONE;
        } else if (state.R == RStatus.BELOW_ONE) {
            uint256 backToOnePayQuote = newQuoteTarget.sub(state.Q);
            uint256 backToOneReceiveBase = state.B.sub(newBaseTarget);
            // case 3: R<1
            // complex case, R status may change
            if (buyBaseAmount < backToOneReceiveBase) {
                // case 3.1: R status do not change
                // no need to check payQuote because spare base token must be greater than zero
                payQuote = _RBelowBuyBaseToken(state, buyBaseAmount, state.Q, newQuoteTarget);
                newRStatus = RStatus.BELOW_ONE;
            } else if (buyBaseAmount == backToOneReceiveBase) {
                // case 3.2: R status changes to ONE
                payQuote = backToOnePayQuote;
                newRStatus = RStatus.ONE;
            } else {
                // case 3.3: R status changes to ABOVE_ONE
                payQuote = backToOnePayQuote.add(
                    _ROneBuyBaseToken(state, buyBaseAmount.sub(backToOneReceiveBase), newBaseTarget)
                );
                newRStatus = RStatus.ABOVE_ONE;
            }
        }

        return (payQuote, lpFeeBase, mtFeeBase, newRStatus, newQuoteTarget, newBaseTarget);
    }

    // ============ R = 1 cases ============

    function _ROneSellBaseToken(PMMState memory state, uint256 amount, uint256 targetQuoteTokenAmount)
        internal
        view
        returns (uint256 receiveQuoteToken)
    {
        uint256 i = state.i;
        uint256 Q2 = DODOMath._SolveQuadraticFunctionForTrade(
            targetQuoteTokenAmount,
            targetQuoteTokenAmount,
            DecimalMath.mul(i, amount),
            false,
            state.K
        );
        // in theory Q2 <= targetQuoteTokenAmount
        // however when amount is close to 0, precision problems may cause Q2 > targetQuoteTokenAmount
        return targetQuoteTokenAmount.sub(Q2);
    }

    function _ROneBuyBaseToken(PMMState memory state, uint256 amount, uint256 targetBaseTokenAmount)
        internal
        view
        returns (uint256 payQuoteToken)
    {
        require(amount < targetBaseTokenAmount, "DODOstate.BNOT_ENOUGH");
        uint256 B2 = targetBaseTokenAmount.sub(amount);
        payQuoteToken = _RAboveIntegrate(state, targetBaseTokenAmount, targetBaseTokenAmount, B2);
        return payQuoteToken;
    }

    // ============ R < 1 cases ============

    function _RBelowSellBaseToken(
        PMMState memory state,
        uint256 amount,
        uint256 quoteBalance,
        uint256 targetQuoteAmount
    ) internal view returns (uint256 receieQuoteToken) {
        uint256 i = state.i;
        uint256 Q2 = DODOMath._SolveQuadraticFunctionForTrade(
            targetQuoteAmount,
            quoteBalance,
            DecimalMath.mul(i, amount),
            false,
            state.K
        );
        return quoteBalance.sub(Q2);
    }

    function _RBelowBuyBaseToken(
        PMMState memory state,
        uint256 amount,
        uint256 quoteBalance,
        uint256 targetQuoteAmount
    ) internal view returns (uint256 payQuoteToken) {
        // Here we don't require amount less than some value
        // Because it is limited at upper function
        // See Trader.queryBuyBaseToken
        uint256 i = state.i;
        uint256 Q2 = DODOMath._SolveQuadraticFunctionForTrade(
            targetQuoteAmount,
            quoteBalance,
            DecimalMath.mulCeil(i, amount),
            true,
            state.K
        );
        return Q2.sub(quoteBalance);
    }

    function _RBelowBackToOne(PMMState memory state) internal view returns (uint256 payQuoteToken) {
        // important: carefully design the system to make sure spareBase always greater than or equal to 0
        uint256 spareBase = state.B.sub(state.B0);
        uint256 price = state.i;
        uint256 fairAmount = DecimalMath.mul(spareBase, price);
        uint256 newTargetQuote = DODOMath._SolveQuadraticFunctionForTarget(state.Q, state.K, fairAmount);
        return newTargetQuote.sub(state.Q);
    }

    // ============ R > 1 cases ============

    function _RAboveBuyBaseToken(
        PMMState memory state,
        uint256 amount,
        uint256 baseBalance,
        uint256 targetBaseAmount
    ) internal view returns (uint256 payQuoteToken) {
        require(amount < baseBalance, "DODOstate.BNOT_ENOUGH");
        uint256 B2 = baseBalance.sub(amount);
        return _RAboveIntegrate(state, targetBaseAmount, baseBalance, B2);
    }

    function _RAboveSellBaseToken(
        PMMState memory state,
        uint256 amount,
        uint256 baseBalance,
        uint256 targetBaseAmount
    ) internal view returns (uint256 receiveQuoteToken) {
        // here we don't require B1 <= targetBaseAmount
        // Because it is limited at upper function
        // See Trader.querySellBaseToken
        uint256 B1 = baseBalance.add(amount);
        return _RAboveIntegrate(state, targetBaseAmount, B1, baseBalance);
    }

    function _RAboveBackToOne(PMMState memory state) internal view returns (uint256 payBaseToken) {
        // important: carefully design the system to make sure spareBase always greater than or equal to 0
        uint256 spareQuote = state.Q.sub(state.Q0);
        uint256 price = state.i;
        uint256 fairAmount = DecimalMath.divFloor(spareQuote, price);
        uint256 newTargetBase = DODOMath._SolveQuadraticFunctionForTarget(state.B, state.K, fairAmount);
        return newTargetBase.sub(state.B);
    }

    // ============ Helper functions ============

    function getExpectedTarget(PMMState memory state) public view returns (uint256 baseTarget, uint256 quoteTarget) {
        uint256 Q = state.Q;
        uint256 B = state.B;
        if (state.R == RStatus.ONE) {
            return (state.B0, state.Q0);
        } else if (state.R == RStatus.BELOW_ONE) {
            uint256 payQuoteToken = _RBelowBackToOne(state);
            return (state.B0, Q.add(payQuoteToken));
        } else if (state.R == RStatus.ABOVE_ONE) {
            uint256 payBaseToken = _RAboveBackToOne(state);
            return (B.add(payBaseToken), state.Q0);
        }
    }

    function _RAboveIntegrate(
        PMMState memory state,
        uint256 B0,
        uint256 B1,
        uint256 B2
    ) internal view returns (uint256) {
        uint256 i = state.i;
        return DODOMath._GeneralIntegrate(B0, B1, B2, i, state.K);
    }

    // function _RBelowIntegrate(
    //     uint256 Q0,
    //     uint256 Q1,
    //     uint256 Q2
    // ) internal view returns (uint256) {
    //     uint256 i = state.i;
    //     i = DecimalMath.divFloor(DecimalMath.ONE, i); // 1/i
    //     return DODOMath._GeneralIntegrate(Q0, Q1, Q2, i, state.K);
    // }
}
