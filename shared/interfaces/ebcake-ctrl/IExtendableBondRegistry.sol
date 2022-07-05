// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IExtendableBondRegistry {
  function admin (  ) external view returns ( address  );
  function appendGroupItem ( string calldata groupName_, address itemAddress_ ) external;
  function createGroup ( string calldata groupName_ ) external;
  function destroyGroup ( string calldata groupName_ ) external;
  function groupNames (  ) external view returns ( string[]  );
  function groupedAddresses ( string calldata groupName_ ) external view returns ( address[]  );
  function initialize ( address admin_ ) external;
  function removeGroupItem ( string calldata groupName_, address itemAddress_ ) external;
  function setAdmin ( address newAdmin ) external;
}
