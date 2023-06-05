// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IPool } from "../interfaces/IPool.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract MockDeriLensAndPool {
    int256 public liquidity;

    struct MarketInfo {
        address underlying;
        address vToken;
        string underlyingSymbol;
        string vTokenSymbol;
        uint256 underlyingPrice;
        uint256 exchangeRate;
        uint256 vTokenBalance;
    }

    struct LpInfo {
        address account;
        uint256 lTokenId;
        address vault;
        int256 amountB0;
        int256 liquidity;
        int256 cumulativePnlPerLiquidity;
        uint256 vaultLiquidity;
        MarketInfo[] markets;
    }

    function getLpInfo(address pool_, address account_) external view returns (LpInfo memory info) {
        return
            LpInfo({
                account: account_,
                lTokenId: 0,
                vault: address(0),
                amountB0: 0,
                liquidity: liquidity,
                cumulativePnlPerLiquidity: 0,
                vaultLiquidity: 0,
                markets: new MarketInfo[](0)
            });
    }

    function addPnl(int256 pnl) external {
        liquidity += pnl;
    }

    function addLiquidity(
        IERC20Metadata underlying,
        uint256 amount,
        IPool.PythData calldata pythData
    ) external payable {
        liquidity += int256(normalizeDecimals(amount, underlying.decimals(), 18));
        underlying.transferFrom(msg.sender, address(this), amount);
    }

    function removeLiquidity(IERC20Metadata underlying, uint256 amount, IPool.PythData calldata pythData) external {
        int256 normalizedAmount = int256(normalizeDecimals(amount, underlying.decimals(), 18));
        if (normalizedAmount > liquidity) {
            liquidity = 0;
            amount = normalizeDecimals(uint256(-liquidity), 18, underlying.decimals());
        } else {
            liquidity -= normalizedAmount;
        }

        underlying.transfer(msg.sender, amount);
    }

    function normalizeDecimals(
        uint256 value_,
        uint256 sourceDecimals_,
        uint256 targetDecimals_
    ) public pure returns (uint256) {
        if (targetDecimals_ == sourceDecimals_) {
            return value_;
        }
        if (targetDecimals_ > sourceDecimals_) {
            return value_ * 10 ** (targetDecimals_ - sourceDecimals_);
        }
        return value_ / 10 ** (sourceDecimals_ - targetDecimals_);
    }
}
