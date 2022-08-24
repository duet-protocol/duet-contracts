//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./DoubleBond.sol";

contract DoubleBondsFactory is Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUE_ROLE = keccak256("ISSUE_ROLE");

    struct DoubleBondPool {
        address bondpool;
        address borrowtoken;
        address staketoken;
        uint256 duration;
        address debtor;
        address clearer;
    }

    DoubleBondPool[] private doublebonds;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(ISSUE_ROLE, msg.sender);
    }

    function getDoubleBonds() external view returns (DoubleBondPool[] memory) {
        return doublebonds;
    }

    function new_double_bonds(
        address _borrowtoken,
        address _staketoken,
        uint256 _start,
        uint256 _duration,
        uint256 _phasenum,
        uint256 _principal,
        uint256 _interestone,
        address _debtor,
        address _clearer,
        uint256 _stakenum
    ) external onlyRole(ISSUE_ROLE) {
        IERC20 token = IERC20(_staketoken);
        require(token.balanceOf(msg.sender) >= _stakenum, "factory:no balance");
        DoubleBond doublebondCon = new DoubleBond(
            _borrowtoken,
            _staketoken,
            _start,
            _duration,
            _phasenum,
            _principal,
            _interestone,
            _debtor,
            _clearer
        );
        DoubleBondPool memory dbp = DoubleBondPool(
            address(doublebondCon),
            _borrowtoken,
            _staketoken,
            _duration,
            _debtor,
            _clearer
        );
        doublebonds.push(dbp);
        token.transferFrom(msg.sender, address(doublebondCon), _stakenum);
    }

    function renewal_double_bond(
        address doubleBond,
        uint256 _phasenum,
        uint256 _principal,
        uint256 _interestone,
        uint256 _stakenum
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DoubleBond dbp = DoubleBond(doubleBond);
        IERC20 token = IERC20(dbp.getstaketoken());
        dbp.renewal(_phasenum, _principal, _interestone);
        token.transferFrom(msg.sender, doubleBond, _stakenum);
    }

    function withdraw_stake(address doubleBond, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DoubleBond dbp = DoubleBond(doubleBond);
        dbp.withdraw_stake(amount);
    }

    function clear(address doubleBond) external onlyRole(DEFAULT_ADMIN_ROLE) {
        DoubleBond dbp = DoubleBond(doubleBond);
        dbp.clear();
    }
}
