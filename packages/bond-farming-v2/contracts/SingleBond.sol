// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ISingleBond } from "./interfaces/ISingleBond.sol";

contract SingleBond is ISingleBond, ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20Metadata;

    IERC20Metadata public immutable underlying;

    uint256 public immutable maturity;

    bool public onlyOwnerMintable;

    event Mint(address indexed to, uint256 amount);
    event Redeem(address indexed to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        IERC20Metadata underlying_,
        uint256 maturity_,
        bool onlyOwnerMintable_
    ) ERC20(name_, symbol_) ReentrancyGuard() Ownable() {
        require(maturity_ > 0, "SingleBond: maturity is 0");
        require(address(underlying_) != address(0), "SingleBond: invalid underlying");

        underlying = underlying_;
        maturity = maturity_;
        onlyOwnerMintable = onlyOwnerMintable_;
    }

    modifier onlyMinter() {
        if (onlyOwnerMintable) {
            require(msg.sender == owner(), "SingleBond: only owner can mint");
        }
        _;
    }
    modifier onlyMatured() {
        require(block.timestamp >= maturity, "SingleBond: MUST_AFTER_MATURITY");
        _;
    }
    modifier onlyBeforeMatured() {
        require(block.timestamp < maturity, "SingleBond: MUST_BEFORE_MATURITY");
        _;
    }

    function decimals() public view virtual override returns (uint8) {
        return underlying.decimals();
    }

    function setOnlyOwnerMintable(bool onlyOwnerMintable_) external onlyOwner {
        onlyOwnerMintable = onlyOwnerMintable_;
    }

    function mint(address to_, uint256 amount_) external onlyBeforeMatured onlyMinter nonReentrant {
        underlying.safeTransferFrom(msg.sender, address(this), amount_);
        _mint(to_, amount_);
        emit Mint(to_, amount_);
    }

    function redeem(address to_, uint256 amount_) external onlyMatured nonReentrant {
        _redeem(to_, amount_);
    }

    function redeemAll(address to_) external onlyMatured nonReentrant {
        _redeem(to_, balanceOf(msg.sender));
    }

    function _redeem(address to_, uint256 amount_) internal {
        _burn(msg.sender, amount_);
        underlying.safeTransfer(to_, amount_);
        emit Redeem(to_, amount_);
    }
}
