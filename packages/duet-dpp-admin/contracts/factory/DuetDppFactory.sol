// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ICloneFactory} from "../lib/CloneFactory.sol";
import {IDPPOracle} from "../intf/IDPPOracle.sol";
import {IDPPController} from "../intf/IDPPController.sol";
import {IDPPOracleAdmin} from "../intf/IDPPOracleAdmin.sol";


contract DuetDPPFactory is InitializableOwnable {
    // ============ default ============

    address public immutable cloneFactory;
    address public immutable weth;
    address public dodoDefautMtFeeRateModel;
    address public dodoApproveProxy;
    address public dodoDefaultMaintainer;

    // ============ Templates ============

    address public dppTemplate;
    address public dppAdminTemplate;
    address public dppControllerTemplate;

    // ============registry and adminlist ==========

    mapping (address => bool) public isAdminListed;
    // base->quote->dppController
    mapping(address => mapping(address => address)) public registry;
    // registry dppController
    mapping(address => address[]) public userRegistry;

    // ============ Events ============

    event NewDPP(
        address baseToken,
        address quoteToken,
        address creator,
        address dpp,
        address dppController
    );

    event addAdmin(address admin);
    event removeAdmin(address admin);

    constructor(
        address owner_,
        address cloneFactory_,
        address dppTemplate_,
        address dppAdminTemplate_,
        address dppControllerTemplate_,
        address defaultMaintainer_,
        address defaultMtFeeRateModel_,
        address dodoApproveProxy_,
        address weth_
    ) public {
        initOwner(owner_);
        weth = weth_;

        cloneFactory = cloneFactory_;
        dppTemplate = dppTemplate_;
        dppAdminTemplate = dppAdminTemplate_;
        dppControllerTemplate = dppControllerTemplate_;

        dodoDefaultMaintainer = defaultMaintainer_;
        dodoDefautMtFeeRateModel = defaultMtFeeRateModel_;
        dodoApproveProxy = dodoApproveProxy_;
    }

    // ============ Admin Operation Functions ============

    function updateDefaultMaintainer(address newMaintainer_) external onlyOwner {
        dodoDefaultMaintainer = newMaintainer_;
    }

    function updateDefaultFeeModel(address newFeeModel_) external onlyOwner {
        dodoDefautMtFeeRateModel = newFeeModel_;
    }

    function updateDodoApprove(address newDodoApprove_) external onlyOwner {
        dodoApproveProxy = newDodoApprove_;
    }

    function updateDppTemplate(address newDPPTemplate_) external onlyOwner {
       dppTemplate = newDPPTemplate_;
    }

    function updateAdminTemplate(address newDPPAdminTemplate_) external onlyOwner {
        dppAdminTemplate = newDPPAdminTemplate_;
    }

    function updateControllerTemplate(address newController_) external onlyOwner {
        dppControllerTemplate = newController_;
    }

    function addAdminList (address contractAddr_) external onlyOwner {
        isAdminListed[contractAddr_] = true;
        emit addAdmin(contractAddr_);
    }

    function removeAdminList (address contractAddr_) external onlyOwner {
        isAdminListed[contractAddr_] = false;
        emit removeAdmin(contractAddr_);
    }

    // ============ Functions ============

    function createDODOPrivatePool() public returns (address newPrivatePool) {
        newPrivatePool = ICloneFactory(cloneFactory).clone(dppTemplate);
    }

    function createDPPAdminModel() public returns (address newDppAdminModel) {
        newDppAdminModel = ICloneFactory(cloneFactory).clone(dppAdminTemplate);
    }

    function createDPPController(
        address creator_, // dpp controller's admin and dppAdmin's operator
        address baseToken_,
        address quoteToken_,
        uint256 lpFeeRate_, // 单位是10**18，范围是[0,10**18] ，代表的是交易手续费
        uint256 k_, // adjust curve's type
        uint256 i_, // 代表的是base 对 quote的价格比例.decimals 18 - baseTokenDecimals+ quoteTokenDecimals. If use oracle, i set here wouldn't be used. 
        address o_, // oracle address
        bool isOpenTwap_, // use twap price or not
        bool isOracleEnabled_ // use oracle or not
    ) external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        require(registry[baseToken_][quoteToken_] == address(0), "HAVE CREATED");
        address dppAddress;
        address dppController;
        {
            dppAddress = createDODOPrivatePool();
            address dppAdminModel = createDPPAdminModel();
            IDPPOracle(dppAddress).init(
                dppAdminModel,
                dodoDefaultMaintainer,
                baseToken_,
                quoteToken_,
                lpFeeRate_,
                dodoDefautMtFeeRateModel,
                k_,
                i_,
                o_,
                isOpenTwap_,
                isOracleEnabled_
            );

            dppController = _createDPPController(
                creator_,
                dppAddress,
                dppAdminModel
            );

            IDPPOracleAdmin(dppAdminModel).init(dppController, dppAddress, creator_, dodoApproveProxy);
        }

        registry[baseToken_][quoteToken_] = dppController;
        userRegistry[creator_].push(dppController);
        emit NewDPP(baseToken_, quoteToken_, creator_, dppAddress, dppController);
    }

    function _createDPPController(
        address admin_,
        address dppAddress_,
        address dppAdminAddress_
    ) internal returns(address dppController) {
        dppController = ICloneFactory(cloneFactory).clone(dppControllerTemplate);
        IDPPController(dppController).init(admin_, dppAddress_, dppAdminAddress_, weth);
    }

}