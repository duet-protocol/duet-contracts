import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IBondTokenUpgradeable is IERC20Upgradeable {
    function mint(address to_, uint256 amount_) external;

    function burnFrom(address account_, uint256 amount_) external;
}
