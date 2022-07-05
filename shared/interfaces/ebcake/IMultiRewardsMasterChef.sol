// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

interface IMultiRewardsMasterChef {
  struct RewardInfo { address token; uint256 amount; }
  function add ( uint256 _allocPoint, address _lpToken, address _proxyFarmer, bool _withUpdate ) external returns ( uint256 pid );
  function addRewardSpec ( address token, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock ) external returns ( uint256 rewardId );
  function admin (  ) external view returns ( address  );
  function deposit ( uint256 _pid, uint256 _amount ) external;
  function depositForUser ( uint256 _pid, uint256 _amount, address user_ ) external;
  function emergencyWithdraw ( uint256 _pid ) external;
  function getMultiplier ( uint256 _from, uint256 _to, uint256 rewardId ) external view returns ( uint256  );
  function getRewardSpecsLength (  ) external view returns ( uint256  );
  function getUserAmount ( uint256 pid_, address user_ ) external view returns ( uint256  );
  function getUserClaimedRewards ( uint256 pid_, address user_, uint256 rewardId_ ) external view returns ( uint256  );
  function getUserRewardDebt ( uint256 pid_, address user_, uint256 rewardId_ ) external view returns ( uint256  );
  function initialize ( address admin_ ) external;
  function massUpdatePools (  ) external;
  function migrate ( uint256 _pid ) external;
  function migrator (  ) external view returns ( address  );
  function pendingRewards ( uint256 _pid, address _user ) external view returns ( RewardInfo[] memory  );
  function poolInfo ( uint256  ) external view returns ( address lpToken, uint256 allocPoint, uint256 lastRewardBlock, address proxyFarmer, uint256 totalAmount );
  function poolLength (  ) external view returns ( uint256  );
  function poolsRewardsAccRewardsPerShare ( uint256 , uint256  ) external view returns ( uint256  );
  function previewSetRewardSpec ( uint256 rewardId, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock ) external view returns ( uint256 depositAmount, uint256 refundAmount );
  function rewardSpecs ( uint256  ) external view returns ( address token, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock, uint256 claimedAmount );
  function set ( uint256 _pid, uint256 _allocPoint, bool _withUpdate ) external;
  function setAdmin ( address admin_ ) external;
  function setMigrator ( address _migrator ) external;
  function setRewardSpec ( uint256 rewardId, uint256 rewardPerBlock, uint256 startedAtBlock, uint256 endedAtBlock ) external;
  function totalAllocPoint (  ) external view returns ( uint256  );
  function updatePool ( uint256 _pid ) external;
  function userInfo ( uint256 , address  ) external view returns ( uint256 amount );
  function withdraw ( uint256 _pid, uint256 _amount ) external;
  function withdrawForUser ( uint256 _pid, uint256 _amount, address user_ ) external;
}
