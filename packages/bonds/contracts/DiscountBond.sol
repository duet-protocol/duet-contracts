// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IBond.sol";
import "./interfaces/IBondFactory.sol";

contract DiscountBond is ERC20Upgradeable, ReentrancyGuardUpgradeable, IBond {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    string public constant kind = "Discount";
    uint256 public constant MIN_TRADING_AMOUNT = 1e12;

    IBondFactory public factory;
    IERC20Upgradeable public underlyingToken;
    uint256 public maturity;
    string public series;
    uint256 public inventoryAmount;
    uint256 public redeemedAmount;

    event BondMinted(address indexed account, uint256 bondAmount, uint256 underlyingAmount);
    event BondSold(address indexed account, uint256 bondAmount, uint256 underlyingAmount);
    event BondRedeemed(address indexed account, uint256 amount);
    event BondGranted(uint256 amount, uint256 inventoryAmount);

    constructor() initializer {}

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory series_,
        address factory_,
        IERC20Upgradeable underlyingToken_,
        uint256 maturity_
    ) external initializer {
        __ERC20_init(name_, symbol_);
        __ReentrancyGuard_init();
        require(
            maturity_ > block.timestamp && maturity_ <= block.timestamp + (20 * 365 days),
            "DiscountBond: INVALID_MATURITY"
        );
        series = series_;
        underlyingToken = underlyingToken_;
        factory = IBondFactory(factory_);
        maturity = maturity_;
    }

    modifier beforeMaturity() {
        require(block.timestamp < maturity, "DiscountBond: MUST_BEFORE_MATURITY");
        _;
    }

    modifier afterMaturity() {
        require(block.timestamp >= maturity, "DiscountBond: MUST_AFTER_MATURITY");
        _;
    }

    modifier tradingGuard() {
        require(getPrice() > 0, "INVALID_PRICE");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == address(factory), "DiscountBond: UNAUTHORIZED");
        _;
    }

    /**
     * @dev grant specific amount of bond for user mint.
     */
    function grant(uint256 amount_) external onlyFactory {
        inventoryAmount += amount_;
        emit BondGranted(amount_, inventoryAmount);
    }

    function getPrice() public view returns (uint256) {
        return factory.getPrice(address(this));
    }

    function mintByUnderlyingAmount(address account_, uint256 underlyingAmount_)
        external
        beforeMaturity
        returns (uint256 bondAmount)
    {
        underlyingToken.safeTransferFrom(msg.sender, address(this), underlyingAmount_);
        bondAmount = previewMintByUnderlyingAmount(underlyingAmount_);
        inventoryAmount -= bondAmount;
        _mint(account_, bondAmount);
        emit BondMinted(account_, bondAmount, underlyingAmount_);
    }

    function previewMintByUnderlyingAmount(uint256 underlyingAmount_)
        public
        view
        beforeMaturity
        tradingGuard
        returns (uint256 bondAmount)
    {
        require(underlyingAmount_ >= MIN_TRADING_AMOUNT, "DiscountBond: AMOUNT_TOO_LOW");
        bondAmount = (underlyingAmount_ * factory.priceFactor()) / getPrice();
        require(inventoryAmount >= bondAmount, "DiscountBond: INSUFFICIENT_LIQUIDITY");
    }

    function mintByBondAmount(address account_, uint256 bondAmount_)
        external
        beforeMaturity
        returns (uint256 underlyingAmount)
    {
        underlyingAmount = previewMintByBondAmount(bondAmount_);
        underlyingToken.safeTransferFrom(msg.sender, address(this), underlyingAmount);
        inventoryAmount -= bondAmount_;
        _mint(account_, bondAmount_);
        emit BondMinted(account_, bondAmount_, underlyingAmount);
    }

    function previewMintByBondAmount(uint256 bondAmount_)
        public
        view
        beforeMaturity
        tradingGuard
        returns (uint256 underlyingAmount)
    {
        require(bondAmount_ >= MIN_TRADING_AMOUNT, "DiscountBond: AMOUNT_TOO_LOW");
        require(inventoryAmount >= bondAmount_, "DiscountBond: INSUFFICIENT_LIQUIDITY");
        underlyingAmount = (bondAmount_ * getPrice()) / factory.priceFactor();
    }

    function sellByBondAmount(uint256 bondAmount_)
        public
        beforeMaturity
        tradingGuard
        returns (uint256 underlyingAmount)
    {
        underlyingAmount = previewSellByBondAmount(bondAmount_);
        _burn(msg.sender, bondAmount_);
        inventoryAmount += bondAmount_;
        underlyingToken.safeTransfer(msg.sender, underlyingAmount);
        emit BondSold(msg.sender, bondAmount_, underlyingAmount);
    }

    function previewSellByBondAmount(uint256 bondAmount_)
        public
        view
        beforeMaturity
        tradingGuard
        returns (uint256 underlyingAmount)
    {
        require(bondAmount_ >= MIN_TRADING_AMOUNT, "DiscountBond: AMOUNT_TOO_LOW");
        require(balanceOf(msg.sender) >= bondAmount_, "DiscountBond: EXCEEDS_BALANCE");
        underlyingAmount = (bondAmount_ * getPrice()) / factory.priceFactor();
        require(underlyingToken.balanceOf(address(this)) >= underlyingAmount, "DiscountBond: INSUFFICIENT_LIQUIDITY");
    }

    function redeem(uint256 bondAmount_) public {
        redeemFor(msg.sender, bondAmount_);
    }

    function faceValue(uint256 bondAmount_) public view returns (uint256) {
        return bondAmount_;
    }

    function amountToUnderlying(uint256 bondAmount_) public view returns (uint256) {
        if (block.timestamp >= maturity) {
            return faceValue(bondAmount_);
        }
        return (bondAmount_ * getPrice()) / factory.priceFactor();
    }

    function redeemFor(address account_, uint256 bondAmount_) public afterMaturity {
        require(balanceOf(msg.sender) >= bondAmount_, "DiscountBond: EXCEEDS_BALANCE");
        _burn(msg.sender, bondAmount_);
        redeemedAmount += bondAmount_;
        underlyingToken.safeTransfer(account_, bondAmount_);
        emit BondRedeemed(account_, bondAmount_);
    }

    /**
     * @notice
     */
    function underlyingOut(uint256 amount_, address to_) external onlyFactory {
        underlyingToken.safeTransfer(to_, amount_);
    }

    function emergencyWithdraw(
        IERC20Upgradeable token_,
        address to_,
        uint256 amount_
    ) external onlyFactory {
        token_.safeTransfer(to_, amount_);
    }
}
