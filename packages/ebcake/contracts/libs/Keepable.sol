
abstract contract Keepable {
    event KeeperUpdated(address indexed user, address indexed newKeeper);

    address public keeper;

    modifier onlyKeeper() virtual {
        require(msg.sender == keeper, "UNAUTHORIZED");

        _;
    }

    function _setKeeper(address newKeeper_) internal {
        keeper = newKeeper_;

        emit KeeperUpdated(msg.sender, newKeeper_);
    }
}
