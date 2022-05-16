// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IMigratorChef {
    function migrate(IERC20 token) external returns (IERC20);
}

// MasterChef is the master of RewardToken. He can make RewardToken and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once RewardToken is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MultiRewardsMasterChef is ReentrancyGuard, Initializable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    address public admin;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        /**
         * @dev rewardDebt mapping. key is reward id, value is reward debt of the reward.
         */
        mapping(uint256 => uint256) rewardDebt; // Reward debt in each reward. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of rewards
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * poolsRewardsAccRewardsPerShare[pid][rewardId]) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accCakePerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. rewards to distribute per block.
        uint256 lastRewardBlock; // Last block number that rewards distribution occurs.
        /**
         * Pool with a proxyFarmer means no lpToken transfer (including withdraw and deposit).
         */
        address proxyFarmer;
        /**
         * total deposited amount.
         */
        uint256 totalAmount;
    }

    struct RewardInfo {
        IERC20 token;
        uint256 amount;
    }

    /**
     * Info of each reward.
     */
    struct RewardSpec {
        IERC20 token;
        uint256 rewardPerBlock;
        uint256 startedAtBlock;
        uint256 endedAtBlock;
        uint256 claimedAmount;
    }

    RewardSpec[] public rewardSpecs;

    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    IMigratorChef public migrator;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(uint256 => uint256)) poolsRewardsAccRewardsPerShare; // Accumulated rewards per share in each reward spec, times 1e12. See below.
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event ClaimRewards(address indexed user, uint256 indexed pid);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    /**
     * @notice Checks if the msg.sender is the admin address.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function initialize(address admin_) public initializer {
        admin = admin_;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do. except as proxied farmer
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        address _proxyFarmer,
        bool _withUpdate
    ) public onlyAdmin {
        if (_withUpdate) {
            massUpdatePools();
        }
        if (_proxyFarmer != address(0)) {
            require(address(_lpToken) == address(0), "LPToken should be address 0 when proxied farmer.");
        }
        uint256 lastRewardBlock = block.number;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                proxyFarmer: _proxyFarmer,
                totalAmount: 0
            })
        );
    }

    // Update the given pool's RewardToken allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyAdmin {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
        }
    }

    function addRewardSpec(
        IERC20 token,
        uint256 rewardPerBlock,
        uint256 startedAtBlock,
        uint256 endedAtBlock
    ) public onlyAdmin {
        require(endedAtBlock > startedAtBlock, "endedAtBlock should be greater than startedAtBlock");
        require(rewardPerBlock > 0, "rewardPerBlock should be greater than zero");

        token.safeTransferFrom(msg.sender, address(this), (endedAtBlock - startedAtBlock) * rewardPerBlock);

        rewardSpecs.push(
            RewardSpec({
                token: token,
                rewardPerBlock: rewardPerBlock,
                startedAtBlock: startedAtBlock,
                endedAtBlock: endedAtBlock,
                claimedAmount: 0
            })
        );
    }

    function setRewardSpec(
        uint256 rewardId,
        uint256 rewardPerBlock,
        uint256 startedAtBlock,
        uint256 endedAtBlock
    ) public onlyAdmin {
        RewardSpec storage rewardSpec = rewardSpecs[rewardId];
        if (rewardSpec.startedAtBlock <= block.number) {
            require(
                startedAtBlock == rewardSpec.startedAtBlock,
                "can not modify startedAtBlock after rewards has began allocating"
            );
        }

        require(endedAtBlock > block.number, "can not modify endedAtBlock to a past block number");
        require(endedAtBlock > startedAtBlock, "endedAtBlock should be greater than startedAtBlock");
        massUpdatePools();
        uint256 requiredAmount = (endedAtBlock - startedAtBlock) * rewardPerBlock;
        uint256 tokenBalance = rewardSpec.token.balanceOf(address(this));
        if (requiredAmount > tokenBalance + rewardSpec.claimedAmount) {
            rewardSpec.token.safeTransferFrom(
                msg.sender,
                address(this),
                requiredAmount - tokenBalance - rewardSpec.claimedAmount
            );
        } else if (requiredAmount < tokenBalance + rewardSpec.claimedAmount) {
            // return overflow tokens
            rewardSpec.token.safeTransferFrom(
                address(this),
                msg.sender,
                (tokenBalance + rewardSpec.claimedAmount) - requiredAmount
            );
        }

        rewardSpec.startedAtBlock = startedAtBlock;
        rewardSpec.endedAtBlock = endedAtBlock;
        rewardSpec.rewardPerBlock = rewardPerBlock;
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorChef _migrator) public onlyAdmin {
        migrator = _migrator;
    }

    // Migrate lp token to another lp contract.
    function migrate(uint256 _pid) public onlyAdmin {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IERC20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        lpToken.safeApprove(address(migrator), bal);
        IERC20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(
        uint256 _from,
        uint256 _to,
        uint256 rewardId
    ) public view returns (uint256) {
        RewardSpec storage rewardSpec = rewardSpecs[rewardId];
        if (_to < rewardSpec.startedAtBlock) {
            return 0;
        }
        if (_from < rewardSpec.startedAtBlock) {
            _from = rewardSpec.startedAtBlock;
        }
        if (_to > rewardSpec.endedAtBlock) {
            _to = rewardSpec.endedAtBlock;
        }
        if (_from > _to) {
            return 0;
        }
        return _to.sub(_from);
    }

    // View function to see pending CAKEs on frontend.
    function pendingRewards(uint256 _pid, address _user) external view returns (RewardInfo[] memory) {
        RewardInfo[] memory rewardsInfo = new RewardInfo[](rewardSpecs.length);
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        for (uint256 rewardId = 0; rewardId < rewardSpecs.length; rewardId++) {
            RewardSpec storage rewardSpec = rewardSpecs[rewardId];

            if (block.number < rewardSpec.startedAtBlock) {
                rewardsInfo[rewardId] = RewardInfo({ token: rewardSpec.token, amount: 0 });
                continue;
            }

            uint256 accRewardPerShare = poolsRewardsAccRewardsPerShare[_pid][rewardId];

            uint256 lpSupply = pool.totalAmount;

            if (block.number > pool.lastRewardBlock && lpSupply != 0) {
                uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, rewardId);
                uint256 rewardAmount = multiplier.mul(rewardSpec.rewardPerBlock).mul(pool.allocPoint).div(
                    totalAllocPoint
                );
                accRewardPerShare = accRewardPerShare.add(rewardAmount.mul(1e12).div(lpSupply));
            }
            rewardsInfo[rewardId] = RewardInfo({
                token: rewardSpec.token,
                amount: user.amount.mul(accRewardPerShare).div(1e12) // .sub(user.rewardDebt)
            });
        }

        return rewardsInfo;
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.totalAmount;
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        for (uint256 rewardId; rewardId < rewardSpecs.length; rewardId++) {
            RewardSpec storage rewardSpec = rewardSpecs[rewardId];

            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, rewardId);
            uint256 reward = multiplier.mul(rewardSpec.rewardPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            poolsRewardsAccRewardsPerShare[_pid][rewardId] = poolsRewardsAccRewardsPerShare[_pid][rewardId].add(
                reward.mul(1e12).div(lpSupply)
            );
        }
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) public {
        _depositOperation(_pid, _amount, msg.sender);
    }

    function depositForUser(
        uint256 _pid,
        uint256 _amount,
        address user_
    ) public {
        _depositOperation(_pid, _amount, user_);
    }

    // Deposit LP tokens to MasterChef for RewardToken allocation.
    function _depositOperation(
        uint256 _pid,
        uint256 _amount,
        address _user
    ) internal nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        if (pool.proxyFarmer != address(0)) {
            require(msg.sender == pool.proxyFarmer, "Only proxy farmer");
        } else {
            require(msg.sender == _user, "Can not deposit for others");
        }

        UserInfo storage user = userInfo[_pid][_user];
        updatePool(_pid);
        for (uint256 rewardId = 0; rewardId < rewardSpecs.length; rewardId++) {
            RewardSpec storage rewardSpec = rewardSpecs[rewardId];
            uint256 accRewardPerShare = poolsRewardsAccRewardsPerShare[_pid][rewardId];
            if (user.amount > 0) {
                uint256 pending = user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt[rewardId]);
                if (pending > 0) {
                    rewardSpec.claimedAmount += pending;
                    rewardSpec.token.safeTransfer(_user, pending);
                }
            }

            user.rewardDebt[rewardId] = user.amount.add(_amount).mul(accRewardPerShare).div(1e12);
        }
        if (_amount > 0) {
            if (pool.proxyFarmer == address(0)) {
                pool.lpToken.safeTransferFrom(address(_user), address(this), _amount);
            }
            pool.totalAmount = pool.totalAmount.add(_amount);
            user.amount = user.amount.add(_amount);
        }
        emit Deposit(_user, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) public {
        _withdrawOperation(_pid, _amount, msg.sender);
    }

    function withdrawForUser(
        uint256 _pid,
        uint256 _amount,
        address user_
    ) public {
        _withdrawOperation(_pid, _amount, user_);
    }

    // Withdraw LP tokens from MasterChef.
    function _withdrawOperation(
        uint256 _pid,
        uint256 _amount,
        address _user
    ) internal nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        require(user.amount >= _amount, "withdraw: Insufficient balance");
        if (pool.proxyFarmer != address(0)) {
            require(msg.sender == pool.proxyFarmer, "Only proxy farmer");
        } else {
            require(msg.sender == _user, "Can not withdraw for others");
        }
        updatePool(_pid);
        for (uint256 rewardId = 0; rewardId < rewardSpecs.length; rewardId++) {
            RewardSpec storage rewardSpec = rewardSpecs[rewardId];
            uint256 accRewardPerShare = poolsRewardsAccRewardsPerShare[_pid][rewardId];
            if (user.amount > 0) {
                uint256 pending = user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt[rewardId]);
                if (pending > 0) {
                    rewardSpec.claimedAmount += pending;
                    rewardSpec.token.safeTransfer(_user, pending);
                }
                user.rewardDebt[rewardId] = user.amount.mul(accRewardPerShare).div(1e12);
            }

            if (_amount > 0) {
                user.rewardDebt[rewardId] = user.amount.sub(_amount).mul(accRewardPerShare).div(1e12);
            }
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.totalAmount = pool.totalAmount.sub(_amount);
            if (pool.proxyFarmer == address(0)) {
                pool.lpToken.safeTransfer(address(_user), _amount);
            }
        }
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(pool.proxyFarmer != address(0), "nothing to withdraw");

        pool.totalAmount = pool.totalAmount.sub(user.amount);
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        user.amount = 0;
        for (uint256 rewardId = 0; rewardId < rewardSpecs.length; rewardId) {
            user.rewardDebt[rewardId] = 0;
        }
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
    }

    function setAdmin(address admin_) public onlyAdmin {
        require(admin_ != address(0), "can not be zero address");
        address previousAdmin = admin;
        admin = admin_;

        emit AdminChanged(previousAdmin, admin_);
    }
}
