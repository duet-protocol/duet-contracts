import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DiscountBond is ERC20 {
    using SafeERC20 for IERC20;
    address public factory;
    IERC20 immutable underlyingToken;
    uint256 public price;
    uint256 immutable maturity;
    uint256 constant priceDecimals = 1e8;

    constructor(
        string memory name_,
        string memory symbol_,
        address factory_,
        IERC20 underlyingToken_,
        uint256 maturity_
    ) ERC20(name_, symbol_) {
        underlyingToken = underlyingToken_;
        factory = factory_;
        maturity = maturity_;
    }

    modifier beforeMaturity() {
        require(block.timestamp < maturity, "Can not do this at maturity");
        _;
    }

    function setPrice(uint256 price_) external beforeMaturity {
        price = price_;
    }

    function mintByUnderlyingAmount(address account_, uint256 underlyingAmount_) beforeMaturity {
        underlyingToken.safeTransferFrom(msg.sender, address(this), underlyingAmount_);
        uint256 bondAmount = (underlyingAmount_ * priceDecimals) / price;
        _mint(account_, bondAmount);
    }

    function mintByAmount(address account_, uint256 bondAmount_) external beforeMaturity {
        uint256 underlyingAmount = (bondAmount_ * price) / priceDecimals;
        underlyingToken.safeTransferFrom(msg.sender, address(this), underlyingAmount);
        _mint(account_, bondAmount_);
    }

    function sellFor(address account_, uint256 bondAmount_) public beforeMaturity {
        _burn();
    }

    function redeem(uint256 bondAmount_) public {
        redeemFor(msg.sender, bondAmount_);
    }

    function redeemFor(address account_, uint256 bondAmount_) public {
        require(balanceOf(msg.sender) >= bondAmount_, "DiscountBond: redeem amount exceeds balance");
        _burn(msg.sender, bondAmount_);
        underlyingToken.safeTransfer(account_, bondAmount_);
    }
}
