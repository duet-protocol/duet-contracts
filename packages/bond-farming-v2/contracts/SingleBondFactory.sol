// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { IERC20MetadataUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { Adminable } from "@private/shared/libs/Adminable.sol";
import { SingleBond } from "./SingleBond.sol";

contract SingleBondFactory is Adminable, Initializable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    IERC20MetadataUpgradeable public underlying;

    address[] public epochs;

    uint256 public initialEpochSeqNumber;

    event NewEpoch(address indexed epoch, uint256 seqNumber, uint256 maturity);

    constructor() {
        _disableInitializers();
    }

    function initialize(IERC20MetadataUpgradeable underlying_, uint256 initialEpochSeqNumber_) external initializer {
        require(address(underlying_) != address(0), "SingleBond: invalid underlying");

        underlying = underlying_;
        initialEpochSeqNumber = initialEpochSeqNumber_;
        _setAdmin(msg.sender);
    }

    function epochsLength() external view returns (uint256) {
        return epochs.length;
    }

    function getEpochAddressBySeqNumber(uint256 seqNumber_) public view returns (address) {
        return epochs[seqNumber_ - initialEpochSeqNumber];
    }

    function newEpoch(uint256 maturity_) external onlyAdmin {
        uint256 seqNumber = epochs.length + initialEpochSeqNumber;
        SingleBond bond = new SingleBond(
            string.concat("Bonded ", underlying.name()),
            string.concat("b", underlying.symbol(), "#", Strings.toString(seqNumber)),
            IERC20Metadata(address(underlying)),
            maturity_,
            true
        );
        epochs.push(address(bond));

        emit NewEpoch(address(bond), seqNumber, maturity_);
    }

    function mintBond(
        uint256 seqNumber,
        address to_,
        uint256 amount_
    ) external onlyAdmin {
        address epochAddress = getEpochAddressBySeqNumber(seqNumber);
        underlying.safeTransferFrom(msg.sender, address(this), amount_);
        underlying.approve(epochAddress, amount_);
        SingleBond(epochAddress).mint(to_, amount_);
    }
}
