//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IDuetOracle.sol";
import "./interfaces/IERC20.sol";
import "./lib/Adminable.sol";

contract DodoOracle is Adminable, Initializable {
    // token address => duet oracle
    mapping(address => IDuetOracle) public duetOracleMapping;
    /**
     * fallback oracle for tokens which no oracle in duetOracleMapping
     */
    IDuetOracle public fallbackDuetOracle;

    function initialize(address admin_) external initializer {
        _setAdmin(admin_);
    }

    function setFallbackDuetOracle(IDuetOracle fallbackDuetOracle_) external onlyAdmin {
        fallbackDuetOracle = fallbackDuetOracle_;
    }

    function setDuetOracle(address token_, IDuetOracle duetOracle_) external onlyAdmin {
        duetOracleMapping[token_] = duetOracle_;
    }

    function prices(address base_) external view returns (uint256 price) {
        if (address(duetOracleMapping[base_]) == address(0)) {
            price = fallbackDuetOracle.getPrice(base_);
        } else {
            price = duetOracleMapping[base_].getPrice(base_);
        }
        require(price > 0, "Invalid price from oracle");

        uint256 baseTokenDecimals = IERC20(base_).decimals();
        // decimals for Dodo is `18 - quote + base`
        // quote token is always BUSD, so use base decimals as dodo oracle decimals.
        // duet oracle returns 1e8 value
        if (baseTokenDecimals == 8) {
            return price;
        }
        if (baseTokenDecimals > 8) {
            return price * 10**(baseTokenDecimals - 8);
        }
        return price / (10**(8 - baseTokenDecimals));
    }
}
