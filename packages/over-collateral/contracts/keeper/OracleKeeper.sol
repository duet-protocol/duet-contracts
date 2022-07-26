// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import  "../interfaces/IDexUsdOracle.sol";
import '../libs/UniswapV2OracleLibrary.sol';

contract OracleKeeper is KeeperCompatibleInterface, Ownable{

    address public dexUSDOracle;

    constructor() {}

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero address");
        dexUSDOracle = _oracle;
    }

    function checkUpkeep( 
        bytes calldata /* checkData */
    ) external view override returns (
        bool upkeepNeeded, 
        bytes memory performData
    ) {
        address pair = IDexUsdOracle(dexUSDOracle).pair();
        uint32 blockTimestampLast1Period = IDexUsdOracle(dexUSDOracle).blockTimestampLast1Period();
        ( , , uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(pair);
        uint32 timeElapsed1Period = blockTimestamp - blockTimestampLast1Period; // overflow is desired

        uint period = IDexUsdOracle(dexUSDOracle).period();
        if(timeElapsed1Period >= period) {
            upkeepNeeded = true;
        }
    }

    function performUpkeep(
        bytes calldata performData
    ) external override {
        IDexUsdOracle(dexUSDOracle).update();
    }

}

