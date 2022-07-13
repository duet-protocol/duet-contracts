// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;


import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";

import "./MintVault.sol";

contract MintVault_Proxy is MintVault, Proxy, ERC1967Upgrade {

    constructor(address _logic) payable {
        assert(_ADMIN_SLOT == bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1));
        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1));
        _changeAdmin(msg.sender);
        _upgradeTo(_logic);
    }

    function upgradeTo(address newImplementation) public {
        require(msg.sender == _getAdmin(), 'Invalid proxy admin');
        _upgradeTo(newImplementation);
    }

    function _implementation() internal view virtual override returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }

}
