pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

interface IDODOApproveProxy {
    function isAllowedProxy(address _proxy) external view returns (bool);
    function claimTokens(address token,address who,address dest,uint256 amount) external;
}