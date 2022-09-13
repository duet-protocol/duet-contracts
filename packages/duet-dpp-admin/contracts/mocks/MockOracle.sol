pragma solidity 0.8.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import { InitializableOwnable } from "../lib/InitializableOwnable.sol";
import "../lib/Adminable.sol";

interface IOracle {
    function prices(address base) external view returns (uint256);
}

contract MockOracle is IOracle, Adminable, Initializable {
    mapping(address => uint256) public priceMapping;

    function initialize(address admin_) external initializer {
        _setAdmin(admin_);
    }

    function setPrice(address base_, uint256 newPrice_) external onlyAdmin {
        priceMapping[base_] = newPrice_;
    }

    function prices(address base) external view override returns (uint256) {
        return priceMapping[base];
    }
}
