//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "../interfaces/ISingleBond.sol";
import "../interfaces/IEpoch.sol";
import "../interfaces/IRouter.sol";
import "../interfaces/IPool.sol";
import "../interfaces/IController.sol";
import "../interfaces/IUSDOracle.sol";

interface IFarming {
    function assetPool(address dyToken) external view returns (address);
}

contract BondReader {
    uint256 private constant SCALE = 1e12;

    ISingleBond private bond;
    address private duet;
    IRouter private router;
    IFarming private farming;
    IController private controller;

    constructor(address _controller, address _bond, address _farming, address _duet, address _router) {
        controller = IController(_controller);
        bond = ISingleBond(_bond);
        farming = IFarming(_farming);
        duet = _duet;
        router = IRouter(_router);
    }

    function epochUsdVaule(address epoch) public view returns (uint256 p) {
        (address oracle, , ) = controller.getValueConf(duet);
        uint256 price = IUSDOracle(oracle).getPrice(duet);
        require(price != 0, "no duet price");
        p = (epochPrice(epoch) * price) / 1e18;
    }

    function duetValue(uint256 amount) public view returns (uint256 value) {
        (address oracle, , ) = controller.getValueConf(duet);
        uint256 price = IUSDOracle(oracle).getPrice(duet);
        value = (price * amount) / 1e18;
    }

    // duet as currency of price
    function epochPrice(address epoch) public view returns (uint256 p) {
        address[] memory paths = new address[](2);
        paths[0] = epoch;
        paths[1] = duet;

        try router.getAmountsOut(1e18, paths) returns (uint256[] memory amounts) {
            p = amounts[1];
        } catch (bytes memory /*lowLevelData*/) {
            p = 1e18;
        }
    }

    function poolPendingAward(
        address pool,
        address user
    )
        external
        view
        returns (address[] memory epochs, uint256[] memory awards, uint256[] memory ends, string[] memory symbols)
    {
        IPool p = IPool(pool);
        (epochs, awards) = p.pending(user);
        uint256 len = epochs.length;
        ends = new uint256[](len);
        symbols = new string[](len);

        for (uint256 i = 0; i < epochs.length; i++) {
            ends[i] = IEpoch(epochs[i]).end();
            symbols[i] = IERC20Metadata(epochs[i]).symbol();
        }
    }

    function myBonds(
        address user
    )
        external
        view
        returns (
            uint256[] memory balances,
            uint256[] memory ends,
            uint256[] memory prices,
            uint256[] memory totals,
            string[] memory symbols
        )
    {
        address[] memory epochs = bond.getEpoches();
        uint256 len = epochs.length;
        balances = new uint256[](len);
        ends = new uint256[](len);
        prices = new uint256[](len);
        totals = new uint256[](len);
        symbols = new string[](len);

        address[] memory paths = new address[](2);
        paths[1] = duet;

        for (uint256 i = 0; i < epochs.length; i++) {
            balances[i] = IERC20(epochs[i]).balanceOf(user);
            ends[i] = IEpoch(epochs[i]).end();
            totals[i] = IERC20(epochs[i]).totalSupply();
            symbols[i] = IERC20Metadata(epochs[i]).symbol();
            paths[0] = epochs[i];

            try router.getAmountsOut(1e18, paths) returns (uint256[] memory amounts) {
                prices[i] = amounts[1];
            } catch (bytes memory /*lowLevelData*/) {
                prices[i] = 1e18;
            }
        }
    }

    //
    function bondsPerBlock(
        address poolAddr,
        uint256 blockSecs
    ) external view returns (address[] memory epochs, uint256[] memory awards) {
        IPool pool = IPool(poolAddr);
        epochs = pool.getEpoches();

        uint256 len = epochs.length;
        awards = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            (, uint256 epochPerSecond) = pool.epochInfos(epochs[i]);
            awards[i] = epochPerSecond * blockSecs;
        }
    }

    function calcDYTokenBondAward(
        address dyToken,
        uint256 time,
        uint256 amount
    )
        external
        view
        returns (address[] memory epochs, uint256[] memory rewards, uint256[] memory values, uint256[] memory endValues)
    {
        address poolAddr = farming.assetPool(dyToken);
        if (poolAddr == address(0)) {
            return (epochs, rewards, values, endValues);
        }

        IPool pool = IPool(poolAddr);
        epochs = pool.getEpoches();

        uint256 totalAmount = pool.totalAmount();
        if (totalAmount < amount) {
            totalAmount = amount;
        }

        uint256 len = epochs.length;

        rewards = new uint256[](len);
        values = new uint256[](len);
        endValues = new uint256[](len);

        for (uint256 i = 0; i < epochs.length; i++) {
            (, uint256 epochPerSecond) = pool.epochInfos(epochs[i]);
            rewards[i] = (epochPerSecond * time * amount) / totalAmount;
            values[i] = (epochUsdVaule(epochs[i]) * rewards[i]) / 1e18;
            endValues[i] = duetValue(rewards[i]);
        }
    }
}
