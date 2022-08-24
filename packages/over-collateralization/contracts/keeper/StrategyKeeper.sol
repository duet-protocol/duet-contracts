// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IStrategy.sol";

contract StrategyKeeper is KeeperCompatibleInterface, Ownable {
    address[] public strategyList;

    constructor() {}

    function addStrategyList(address[] memory newStrategy) external onlyOwner {
        if (newStrategy.length == 0) return;
        for (uint256 i = 0; i < newStrategy.length; i++) {
            strategyList.push(newStrategy[i]);
        }
    }

    function validStrategy(address strategy) internal view returns (bool valid) {
        for (uint256 i = 0; i < strategyList.length; i++) {
            if (strategy == strategyList[i]) {
                return true;
            }
        }
        return false;
    }

    function removeStrategyList(uint256 index) external onlyOwner {
        uint256 len = strategyList.length;
        if (index >= len) return;
        for (uint256 i = index; i < len - 1; i++) {
            strategyList[i] = strategyList[i + 1];
        }
        strategyList.pop();
    }

    function getStrategyList() external view returns (address[] memory) {
        return strategyList;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        for (uint256 i = 0; i < strategyList.length; i++) {
            uint256 pendingOutput = IStrategy(strategyList[i]).pendingOutput();
            uint256 minHarvestAmount = IStrategy(strategyList[i]).minHarvestAmount();

            if (pendingOutput > minHarvestAmount) {
                performData = abi.encodePacked(performData, _addressToBytes(strategyList[i]));
            }
        }

        if (performData.length > 0) {
            upkeepNeeded = true;
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256 len = performData.length;
        uint256 acc = 0;
        while (acc < len) {
            address strategy = address(_toBytes20(performData, acc));
            require(validStrategy(strategy), "invalid strategy");
            IStrategy(strategy).harvest();
            acc += 20;
        }
    }

    function _addressToBytes(address a) internal pure returns (bytes memory b) {
        assembly {
            let m := mload(0x40)
            a := and(a, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
        }
    }

    function _toBytes20(bytes memory _b, uint256 _offset) internal pure returns (bytes20) {
        bytes20 out;

        for (uint256 i = 0; i < 20; i++) {
            out |= bytes20(_b[_offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }
}
