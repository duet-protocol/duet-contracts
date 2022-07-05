// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IBondFarmingPool {
  function admin (  ) external view returns ( address  );
  function amountToShares ( uint256 amount_ ) external view returns ( uint256  );
  function bond (  ) external view returns ( address  );
  function bondToken (  ) external view returns ( address  );
  function claimBonuses (  ) external;
  function earnedToDate ( address user_ ) external view returns ( int256  );
  function initialize ( address bondToken_, address bond_, address admin_ ) external;
  function lastUpdatedPoolAt (  ) external view returns ( uint256  );
  function masterChef (  ) external view returns ( address  );
  function masterChefPid (  ) external view returns ( uint256  );
  function paused (  ) external view returns ( bool  );
  function pendingRewardsByShares ( uint256 shares_ ) external view returns ( uint256  );
  function setAdmin ( address newAdmin ) external;
  function setMasterChef ( address masterChef_, uint256 masterChefPid_ ) external;
  function setSiblingPool ( address siblingPool_ ) external;
  function sharesToBondAmount ( uint256 shares_ ) external view returns ( uint256  );
  function siblingPool (  ) external view returns ( address  );
  function stake ( uint256 amount_ ) external;
  function stakeForUser ( address user_, uint256 amount_ ) external;
  function totalPendingRewards (  ) external view returns ( uint256  );
  function totalShares (  ) external view returns ( uint256  );
  function underlyingAmount ( bool exclusiveFees ) external view returns ( uint256  );
  function unstake ( uint256 shares_ ) external;
  function unstakeAll (  ) external;
  function unstakeByAmount ( uint256 amount_ ) external;
  function updatePool (  ) external;
  function usersInfo ( address  ) external view returns ( uint256 shares, int256 accNetStaked );
}
