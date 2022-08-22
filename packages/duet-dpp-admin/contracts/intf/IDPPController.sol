pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

interface IDPPController {
    function init(
        address admin,
        address dppAddress,
        address dppAdminAddress,
        address weth
    ) external;
}