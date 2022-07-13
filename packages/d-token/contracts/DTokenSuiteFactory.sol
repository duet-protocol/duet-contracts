// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@private/shared/libs/Adminable.sol";
import "@private/shared/3rd/chainlink/AggregatorV3Interface.sol";

import "./interfaces/IController.sol";
import "./interfaces/IUpgradable.sol";
import "./DToken.sol";
import "./DTokenUSDOracle.sol";
import "./MintVault.sol";
import "./MintVault_Proxy.sol";


contract DTokenSuiteFactory is Initializable, Adminable {

    struct DTokenSuite {
        address token;
        address vault;
        address oracle;
    }

    DTokenSuite[] private dTokens;
    event DTokenCreated(address token, address vault, address oracle);

    IController public appCtrl;
    address public feeConf;

    address public sharedVaultImplement;


    // --------------


    function dTokenList() view external returns (DTokenSuite[] memory) {
        return dTokens;
    }

    function initialize(
        address admin_,
        address appCtrl_,
        address feeConf_,
        address sharedVaultImplement_
    ) public initializer {
        require(admin_ != address(0), "Cant set admin to zero address");
        _setAdmin(admin_);

        appCtrl = IController(appCtrl_);
        feeConf = feeConf_;
        sharedVaultImplement = sharedVaultImplement_;
    }

    function updateAppCtrl(address contract_) external onlyAdmin {
        appCtrl = IController(contract_);
    }

    function updateFeeConf(address contract_) external onlyAdmin {
        feeConf = contract_;
    }


     // --------------


    function setSharedVaultImplement(address implement_) external onlyAdmin {
        sharedVaultImplement = implement_;
        for (uint256 i; i < dTokens.length; i++) {
            IUpgradable(dTokens[i].vault).upgradeTo(sharedVaultImplement);
        }
    }

    function createMintingSuite(
        string memory name_,
        string memory symbol_,
        AggregatorV3Interface aggregator_
    ) external onlyAdmin {
        DToken token = new DToken(name_, symbol_);
        DTokenUSDOracle oracle = new DTokenUSDOracle();

        MintVault_Proxy vault = new MintVault_Proxy(sharedVaultImplement);
        vault.initialize(address(appCtrl), feeConf, address(token));

        oracle.setAggregator(address(token), aggregator_);
        token.addMiner(address(vault));

        DTokenSuite memory suite = DTokenSuite(address(token), address(vault), address(oracle));
        dTokens.push(suite);
        emit DTokenCreated(suite.token, suite.vault, suite.oracle);
    }


    function forgetMintingSuite(uint index) external onlyAdmin {
        for(uint i = index; i < dTokens.length - 1; i++){
            dTokens[i] = dTokens[i +1 ];
        }
        dTokens.pop();
    }


}
