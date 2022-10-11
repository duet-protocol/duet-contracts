import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./DYTokenERC20.sol";
import "./interfaces/IUSDOracle.sol";
import "./interfaces/IDepositVaultInitializer.sol";
import "./libs/Adminable.sol";
import "./interfaces/IController.sol";

contract VaultFactory is Initializable, Adminable {
    IController public controller;
    address public feeConf;
    address[] public vaults;
    mapping(string => address) public vaultImplementations;
    string[] public vaultKinds;
    address public vaultProxyAdmin;

    event VaultCreated(address indexed vault);

    function initialize(
        IController controller_,
        address feeConf_,
        address admin_,
        address vaultProxyAdmin_
    ) external initializer {
        controller = controller_;
        feeConf = feeConf_;
        _setAdmin(admin_);
        vaultProxyAdmin = vaultProxyAdmin_;
    }

    function setController(IController controller_) external onlyAdmin {
        controller = controller_;
    }

    function setVaultProxyAdmin(address vaultProxyAdmin_) external onlyAdmin {
        vaultProxyAdmin = vaultProxyAdmin_;
    }

    function setFeeConf(address feeConf_) external onlyAdmin {
        feeConf = feeConf_;
    }

    function setVaultImplementation(string calldata kind_, address impl_) external onlyAdmin {
        if (vaultImplementations[kind_] == address(0)) {
            vaultKinds.push(kind_);
        }
        vaultImplementations[kind_] = impl_;
    }

    function createDepositVault(
        IERC20Metadata underlying_,
        IUSDOracle oracle_,
        uint16 discount_,
        uint16 premium_,
        string calldata kind_
    ) external onlyAdmin returns (address vaultAddress) {
        DYTokenERC20 dyToken = new DYTokenERC20(address(underlying_), underlying_.symbol(), address(controller));
        address dyTokenAddress = address(dyToken);
        controller.setDYToken(address(underlying_), dyTokenAddress);
        address vaultImpl = vaultImplementations[kind_];
        require(vaultImpl != address(0), "Invalid vault kind");
        bytes memory proxyData;
        require(vaultProxyAdmin != address(0), "invalid vault proxy admin");
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(vaultImpl, vaultProxyAdmin, proxyData);
        vaultAddress = address(proxy);
        IDepositVaultInitializer vault = IDepositVaultInitializer(vaultAddress);
        vault.initialize(address(controller), feeConf, dyTokenAddress);
        controller.setVault(dyTokenAddress, vaultAddress, 1);
        _initValidVault(vaultAddress);
        controller.setOracles(address(underlying_), address(oracle_), discount_, premium_);
        controller.setVaultStates(
            vaultAddress,
            IController.VaultState({
                enabled: true,
                enableDeposit: true,
                enableWithdraw: true,
                enableBorrow: false,
                enableRepay: false,
                enableLiquidate: true
            })
        );
        vault.transferOwnership(msg.sender);
        vaults.push(vaultAddress);
        emit VaultCreated(vaultAddress);
    }

    function _initValidVault(address vaultAddress) internal {
        IController.ValidVault[] memory validVault = new IController.ValidVault[](1);
        validVault[0] = IController.ValidVault.No;
        address[] memory validVaultAddress = new address[](1);
        validVaultAddress[0] = vaultAddress;
        // can not be collateralized by default, enable manually if needed
        controller.initValidVault(validVaultAddress, validVault);
    }
}
