

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";

interface IOracle {

    function prices(address base) external view returns (uint256);
    
}

contract MockOracle is IOracle, InitializableOwnable {

    uint256 basePrices = 317460317500000;

    constructor() public {
        initOwner(msg.sender);
    }

    function changePrices(uint256 newPrices_) external onlyOwner {
        basePrices = newPrices_;
    }  

    function prices(address base) external override view returns (uint256) {
        return basePrices;
    }
    
}