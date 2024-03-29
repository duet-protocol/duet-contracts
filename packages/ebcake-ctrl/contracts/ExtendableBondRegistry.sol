// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@private/shared/libs/Adminable.sol";

contract ExtendableBondRegistry is Initializable, Adminable {
    string[] private groups;
    mapping(string => address[]) private groupedExtendableBonds;

    event GroupCreated(string indexed groupTopic);
    event GroupDestroyed(string indexed groupTopic);
    event GroupItemAppended(string indexed groupTopic, address item);
    event GroupItemRemoved(string indexed groupTopic, address item);

    // --------------

    function initialize(address admin_) public initializer {
        require(admin_ != address(0), "Cant set admin to zero address");
        _setAdmin(admin_);
    }

    function groupNames() external view returns (string[] memory) {
        return groups;
    }

    function groupedAddresses(string calldata groupName_) external view returns (address[] memory) {
        return groupedExtendableBonds[groupName_];
    }

    // --------------

    function createGroup(string calldata groupName_) external onlyAdmin {
        for (uint256 i; i < groups.length; i++) {
            if (keccak256(abi.encodePacked(groups[i])) == keccak256(abi.encodePacked(groupName_))) {
                revert("Duplicate group name");
            }
        }
        address[] memory newList;
        groupedExtendableBonds[groupName_] = newList;
        groups.push(groupName_);
        emit GroupCreated(groupName_);
    }

    function destroyGroup(string calldata groupName_) external onlyAdmin {
        int256 indexOf = -1;
        for (uint256 i; i < groups.length; i++) {
            if (keccak256(abi.encodePacked(groups[i])) == keccak256(abi.encodePacked(groupName_))) {
                indexOf = int256(i);
                break;
            }
        }
        if (indexOf < 0) revert("Unregistred group name");
        groups[uint256(indexOf)] = groups[groups.length - 1];
        groups.pop();
        delete groupedExtendableBonds[groupName_];
        emit GroupDestroyed(groupName_);
    }

    function appendGroupItem(
        string calldata groupName_,
        address itemAddress_
    ) external onlyAdmin onlyGroupNameRegistered(groupName_) {
        address[] storage group = groupedExtendableBonds[groupName_];
        for (uint256 i; i < group.length; i++) {
            if (group[i] == itemAddress_) revert("Duplicate address in group");
        }
        group.push(itemAddress_);
        emit GroupItemAppended(groupName_, itemAddress_);
    }

    function removeGroupItem(
        string calldata groupName_,
        address itemAddress_
    ) external onlyAdmin onlyGroupNameRegistered(groupName_) {
        address[] storage group = groupedExtendableBonds[groupName_];
        if (group.length == 0) return;
        for (uint256 i = group.length - 1; i >= 0; i--) {
            if (group[i] != itemAddress_) continue;
            group[i] = group[group.length - 1];
            group.pop();
            emit GroupItemRemoved(groupName_, itemAddress_);
            break;
        }
    }

    // --------------

    modifier onlyGroupNameRegistered(string calldata groupName_) virtual {
        bool found;
        for (uint256 i; i < groups.length; i++) {
            if (keccak256(abi.encodePacked(groups[i])) == keccak256(abi.encodePacked(groupName_))) {
                found = true;
                break;
            }
        }
        require(found, "Unregistred group name");

        _;
    }
}
