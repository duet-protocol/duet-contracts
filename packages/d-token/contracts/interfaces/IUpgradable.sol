//SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

interface IUpgradable {

  function upgradeTo(address newImplementation) external;

  function upgradeToAndCall(
      address newImplementation,
      bytes memory data,
      bool forceCall
  ) external;

}
