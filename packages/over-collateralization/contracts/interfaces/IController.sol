// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IController {
    // manage Vault state for risk control
    struct VaultState {
        bool enabled;
        bool enableDeposit;
        bool enableWithdraw;
        bool enableBorrow;
        bool enableRepay;
        bool enableLiquidate;
    }

    function dyTokens(address) external view returns (address);

    function getValueConf(address _underlying) external view returns (address oracle, uint16 dr, uint16 pr);

    function getValueConfs(
        address token0,
        address token1
    ) external view returns (address oracle0, uint16 dr0, uint16 pr0, address oracle1, uint16 dr1, uint16 pr1);

    function strategies(address) external view returns (address);

    function dyTokenVaults(address) external view returns (address);

    function beforeDeposit(address, address _vault, uint256) external view;

    function beforeBorrow(address _borrower, address _vault, uint256 _amount) external view;

    function beforeWithdraw(address _redeemer, address _vault, uint256 _amount) external view;

    function beforeRepay(address _repayer, address _vault, uint256 _amount) external view;

    function joinVault(address _user, bool isDeposit) external;

    function exitVault(address _user, bool isDeposit) external;

    function userValues(
        address _user,
        bool _dp
    ) external view returns (uint256 totalDepositValue, uint256 totalBorrowValue);

    function userTotalValues(
        address _user,
        bool _dp
    ) external view returns (uint256 totalDepositValue, uint256 totalBorrowValue);

    function liquidate(address _borrower, bytes calldata data) external;

    // ValidVault 0: uninitialized, default value
    // ValidVault 1: No, vault can not be collateralized
    // ValidVault 2: Yes, vault can be collateralized
    enum ValidVault {
        UnInit,
        No,
        Yes
    }

    function initValidVault(address[] memory _vault, ValidVault[] memory _state) external;

    function validVaults(address _vault) external view returns (ValidVault);

    function validVaultsOfUser(address _vault, address _user) external view returns (ValidVault);

    function setDYToken(address _underlying, address _dToken) external;

    function setVault(address _dyToken, address _vault, uint256 vtype) external;

    function setOracles(address _underlying, address _oracle, uint16 _discount, uint16 _premium) external;

    function setVaultStates(address _vault, VaultState memory _state) external;
}
