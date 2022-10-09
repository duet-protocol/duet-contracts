//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "../interfaces/IUSDOracle.sol";
import "../interfaces/IDPPController.sol";
import "../chainlink/AggregatorV3Interface.sol";

contract DuetDppLpOracle is IUSDOracle, Initializable, OwnableUpgradeable {
    bool _AVAILABLE_;

    struct CtrlInfo {
        IDPPController controller;
        address baseToken;
        address quoteToken;
        uint256 baseTokenDecimals;
        uint256 quoteTokenDecimals;
    }

    mapping(address => AggregatorV3Interface) public aggregators;

    event SetAggregator(address indexed token, AggregatorV3Interface indexed aggregator);

    constructor() {}

    function initialize() external initializer {
        OwnableUpgradeable.__Ownable_init();
        _AVAILABLE_ = false;
    }

    function setAggregator(address token, AggregatorV3Interface aggregator) external onlyOwner {
        uint8 dec = aggregator.decimals();
        require(dec == 8, "not support decimals");
        aggregators[token] = aggregator;
        emit SetAggregator(token, aggregator);
    }

    // set status for use this oracle
    function setAvailable(bool _aval) external onlyOwner {
        _AVAILABLE_ = _aval;
    }

    // get latest price
    // warn!: high risk
    function getPrice(address _token) external view override returns (uint256 price) {
        require(_AVAILABLE_, "duet lp oracle: high risk");

        CtrlInfo memory curCtrl = getCtrlInfo(_token);
        (uint256 baseOut, uint256 quoteOut) = curCtrl.controller.recommendBaseAndQuote(10**curCtrl.baseTokenDecimals);
        (, int256 basePrice, , , ) = aggregators[curCtrl.baseToken].latestRoundData();
        (, int256 quotePrice, , , ) = aggregators[curCtrl.quoteToken].latestRoundData();
        require(basePrice >= 0 && quotePrice >= 0, "Negative Price!");

        // base-quote decimal correct
        // ctrl-lp is base decimals, just need to correct quote decimals
        uint256 priceWithDecimal;
        if (curCtrl.baseTokenDecimals > curCtrl.quoteTokenDecimals ) {
            uint256 correctDecimal = curCtrl.baseTokenDecimals - curCtrl.quoteTokenDecimals;
            priceWithDecimal = baseOut * uint256(basePrice) + quoteOut * uint256(quotePrice) * (10**correctDecimal);
        } else if (curCtrl.baseTokenDecimals - curCtrl.quoteTokenDecimals == 0) {
            priceWithDecimal = baseOut * uint256(basePrice) + quoteOut * uint256(quotePrice);
        } else if (curCtrl.baseTokenDecimals < curCtrl.quoteTokenDecimals  ) {
            uint256 correctDecimal = curCtrl.quoteTokenDecimals - curCtrl.baseTokenDecimals;
            priceWithDecimal = baseOut * uint256(basePrice) + (quoteOut * uint256(quotePrice)) / (10**correctDecimal);
        }

        return priceWithDecimal / (10**curCtrl.baseTokenDecimals);
    }

    function getCtrlInfo(address _ctrl) public view returns (CtrlInfo memory ctrlInfo) {
        ctrlInfo.controller = IDPPController(_ctrl);

        ctrlInfo.baseToken = IDPPController(_ctrl)._BASE_TOKEN_();
        ctrlInfo.quoteToken = IDPPController(_ctrl)._QUOTE_TOKEN_();
        ctrlInfo.baseTokenDecimals = IERC20Metadata(ctrlInfo.baseToken).decimals();
        ctrlInfo.quoteTokenDecimals = IERC20Metadata(ctrlInfo.quoteToken).decimals();
    }
}
