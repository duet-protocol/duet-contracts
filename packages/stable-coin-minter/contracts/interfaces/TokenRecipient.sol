pragma solidity >=0.6.0;

interface TokenRecipient {
    // must return ture
    function tokensReceived(address from, uint256 amount, bytes calldata exData) external returns (bool);
}
