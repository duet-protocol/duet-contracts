/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import { SafeMath } from "../lib/SafeMath.sol";
import { DecimalMath } from "../lib/DecimalMath.sol";

/**
 * @title Storage
 * @author DODO Breeder
 *
 * @notice Local Variables
 */
contract Storage {
    using SafeMath for uint256;
    enum RStatus {
        ONE,
        ABOVE_ONE,
        BELOW_ONE
    }

    address public _BASE_TOKEN_;
    address public _QUOTE_TOKEN_;

    // ============ Variables for PMM Algorithm ============

    uint256 public _LP_FEE_RATE_;
    uint256 public _MT_FEE_RATE_;
    uint256 public _K_;
    uint256 public _R_;

    RStatus public _R_STATUS_;
    uint256 public _TARGET_BASE_TOKEN_AMOUNT_;
    uint256 public _TARGET_QUOTE_TOKEN_AMOUNT_;
    uint256 public _BASE_BALANCE_;
    uint256 public _QUOTE_BALANCE_;
    uint256 public _I_;

    // ============ Helper Functions ============

    function _checkDODOParameters() internal view returns (uint256) {
        require(_K_ < DecimalMath.ONE, "K>=1");
        require(_K_ > 0, "K=0");
        require(_LP_FEE_RATE_.add(_MT_FEE_RATE_) < DecimalMath.ONE, "FEE_RATE>=1");
    }

    function getOraclePrice() public view returns (uint256) {
        return _I_;
    }
}
