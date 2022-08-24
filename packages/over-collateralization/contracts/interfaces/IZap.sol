pragma solidity >=0.8.0;

interface IZap {
    function lpToToken(
        address _lp,
        uint256 _amount,
        address _token,
        address _toUser,
        uint256 minAmout
    ) external returns (uint256 amount);

    function tokenToLpbyPath(
        address _token,
        uint256 amount,
        address _lp,
        bool needDeposit,
        address[] memory pathArr0,
        address[] memory pathArr1
    ) external;
}
