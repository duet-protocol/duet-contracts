// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./MockBEP20.sol";
import "../interfaces/IExtendableBond.sol";
import "../interfaces/IBondFarmingPool.sol";
import "../BondToken.sol";

contract MockExtendableBond is IExtendableBond {
    MockBEP20 bondToken;

    uint256 public mintedRewards = 0;
    uint256 public startBlock = 0;

    IBondFarmingPool public bondPool;
    IBondFarmingPool public lpPool;

    constructor(MockBEP20 bondToken_) {
        bondToken = bondToken_;
    }

    function setFarmingPool(IBondFarmingPool bondPool_, IBondFarmingPool lpPool_) external {
        bondPool = bondPool_;
        lpPool = lpPool_;
    }

    function setStartBlock(uint256 startBlock_) public {
        require(mintedRewards == 0, "can not modify after minted.");
        startBlock = startBlock_;
    }

    function totalPendingRewards() public view returns (uint256) {
        console.log("block.number", block.number);
        console.log("startBlock", startBlock);
        if (startBlock >= block.number) {
            return 0;
        }
        return ((block.number - startBlock) * 40 * 1e18) - mintedRewards;
    }

    function mintBondTokenForRewards(address to_, uint256 amount_) external {
        mintedRewards += amount_;
        console.log("contract mintBondTokenForRewards", amount_);
        bondToken.mint(to_, amount_);
    }

    function updateBondPools() external {
        bondPool.updatePool();
        lpPool.updatePool();
    }

    function testInvalidUpdateBondPools() external {
        lpPool.updatePool();
        bondPool.updatePool();
    }
}
