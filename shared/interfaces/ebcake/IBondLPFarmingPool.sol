// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IBondLPFarmingPool {
  function ACC_REWARDS_PRECISION (  ) external view returns ( uint256  );
  function accRewardPerShare (  ) external view returns ( uint256  );
  function admin (  ) external view returns ( address  );
  function bond (  ) external view returns ( address  );
  function bondRewardsSuspended (  ) external view returns ( bool  );
  function bondToken (  ) external view returns ( address  );
  function claimBonuses (  ) external;
  function getUserPendingRewards ( address user_ ) external view returns ( uint256  );
  function initialize ( address bondToken_, address bond_, address admin_ ) external;
  function lastUpdatedPoolAt (  ) external view returns ( uint256  );
  function lpToken (  ) external view returns ( address  );
  function masterChef (  ) external view returns ( address  );
  function masterChefPid (  ) external view returns ( uint256  );
  function paused (  ) external view returns ( bool  );
  function setAdmin ( address newAdmin ) external;
  function setBondRewardsSuspended ( bool suspended_ ) external;
  function setLpToken ( address lpToken_ ) external;
  function setMasterChef ( address masterChef_, uint256 masterChefPid_ ) external;
  function setSiblingPool ( address siblingPool_ ) external;
  function siblingPool (  ) external view returns ( address  );
  function stake ( uint256 amount_ ) external;
  function stakeForUser ( address user_, uint256 amount_ ) external;
  function totalLpAmount (  ) external view returns ( uint256  );
  function totalPendingRewards (  ) external view returns ( uint256  );
  function unstake ( uint256 amount_ ) external;
  function unstakeAll (  ) external;
  function updatePool (  ) external;
  function usersInfo ( address  ) external view returns ( uint256 lpAmount, uint256 rewardDebt, uint256 pendingRewards, uint256 claimedRewards );
}
