//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IMasterChef {
    function cake() external view returns (address);

    function poolLength() external view returns (uint256);

    function cakePerBlock() external view returns (uint256);

    function totalAllocPoint() external view returns (uint256);

    function poolInfo(
        uint256 pid
    ) external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accSushiPerShare);

    function userInfo(uint256 pid, address user) external view returns (uint256 amount, uint256 rewardDebt);

    // View function to see pending SUSHIs on frontend.
    function pendingCake(uint256 _pid, address _user) external view returns (uint256);

    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function emergencyWithdraw(uint256 _pid) external;

    function enterStaking(uint256 _amount) external;

    function leaveStaking(uint256 _amount) external;
}
