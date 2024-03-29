//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./interfaces/IVaultFarm.sol";
import "./interfaces/ISingleBond.sol";
import "./interfaces/IEpoch.sol";
import "./interfaces/IVault.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Pool.sol";
import "./CloneFactory.sol";

contract VaultFarm is IVaultFarm, CloneFactory, OwnableUpgradeable {
    address public bond;
    address public poolImp;

    address[] public pools;
    // pool => point
    mapping(address => uint256) public allocPoint;
    // asset => pool
    mapping(address => address) public assetPool;

    mapping(address => bool) public vaults;

    uint256 public totalAllocPoint;
    uint256 public lastUpdateSecond;
    uint256 public periodFinish;

    address[] public epoches;
    uint256[] public epochRewards;

    event NewPool(address asset, address pool);
    event SetPoolImp(address poolimp);
    event VaultApproved(address vault, bool approved);
    event WithdrawAward(address user, address[] pools, bool redeem);
    event RedeemAward(address user, address[] pools);
    event EmergencyWithdraw(address[] epochs, uint256[] amounts);

    constructor() {}

    function initialize(address _bond, address _poolImp) external initializer {
        OwnableUpgradeable.__Ownable_init();
        bond = _bond;
        poolImp = _poolImp;
    }

    function setPoolImp(address _poolImp) external onlyOwner {
        poolImp = _poolImp;
        emit SetPoolImp(_poolImp);
    }

    function approveVault(address vault, bool approved) external onlyOwner {
        vaults[vault] = approved;
        emit VaultApproved(vault, approved);
    }

    function assetPoolAlloc(address asset) external view returns (address pool, uint256 alloc) {
        pool = assetPool[asset];
        alloc = allocPoint[pool];
    }

    function getPools() external view returns (address[] memory ps) {
        ps = pools;
    }

    function epochesRewards() external view returns (address[] memory epochs, uint256[] memory rewards) {
        epochs = epoches;
        rewards = epochRewards;
    }

    function doSyncVault(IVault vault, Pool pool, address user) internal returns (bool equaled) {
        uint256 amount = vault.deposits(user);
        uint256 currAmount = pool.deposits(user);

        if (amount > currAmount) {
            pool.deposit(user, amount - currAmount);
        } else if (amount < currAmount) {
            pool.withdraw(user, currAmount - amount);
        } else {
            equaled = true;
        }
    }

    function syncVault(address vault) external {
        require(vaults[vault], "invalid vault");
        address asset = IVault(vault).underlying();

        address pooladdr = assetPool[asset];
        require(pooladdr != address(0), "no asset pool");
        bool equaled = doSyncVault(IVault(vault), Pool(pooladdr), msg.sender);
        require(!equaled, "aleady migrated");
    }

    // sync Vault by batch of users
    function syncVaultbyBatch(address vault, address[] memory users) external {
        require(vaults[vault], "invalid vault");
        address asset = IVault(vault).underlying();

        address pooladdr = assetPool[asset];
        require(pooladdr != address(0), "no asset pool");

        for (uint256 i = 0; i < users.length; i++) {
            doSyncVault(IVault(vault), Pool(pooladdr), users[i]);
        }
    }

    function syncDeposit(address _user, uint256 _amount, address asset) external override {
        require(vaults[msg.sender], "invalid vault");
        address pooladdr = assetPool[asset];
        if (pooladdr != address(0)) {
            Pool(pooladdr).deposit(_user, _amount);
        }
    }

    function syncWithdraw(address _user, uint256 _amount, address asset) external override {
        require(vaults[msg.sender], "invalid vault");
        address pooladdr = assetPool[asset];
        if (pooladdr != address(0)) {
            Pool(pooladdr).withdraw(_user, _amount);
        }
    }

    function syncLiquidate(address _user, address asset) external override {
        require(vaults[msg.sender], "invalid vault");
        address pooladdr = assetPool[asset];
        if (pooladdr != address(0)) {
            Pool(pooladdr).liquidate(_user);
        }
    }

    function massUpdatePools(address[] memory epochs, uint256[] memory rewards) internal {
        uint256 poolLen = pools.length;
        uint256 epochLen = epochs.length;

        uint256[] memory epochArr = new uint256[](epochLen);
        for (uint256 pi = 0; pi < poolLen; pi++) {
            for (uint256 ei = 0; ei < epochLen; ei++) {
                epochArr[ei] = (rewards[ei] * allocPoint[pools[pi]]) / totalAllocPoint;
            }
            Pool(pools[pi]).updateReward(epochs, epochArr, periodFinish);
        }

        epochRewards = rewards;
        lastUpdateSecond = block.timestamp;
    }

    // epochs need small for gas issue.
    function newReward(address[] memory epochs, uint256[] memory rewards, uint256 duration) public onlyOwner {
        require(block.timestamp >= periodFinish, "period not finish");
        require(epochs.length == rewards.length, "mismatch length");
        require(duration > 0, "duration zero");

        periodFinish = block.timestamp + duration;
        epoches = epochs;
        massUpdatePools(epochs, rewards);

        for (uint256 i = 0; i < epochs.length; i++) {
            require(IEpoch(epochs[i]).bond() == bond, "invalid epoch");
            IERC20(epochs[i]).transferFrom(msg.sender, address(this), rewards[i]);
        }
    }

    function appendReward(address epoch, uint256 reward) public onlyOwner {
        require(block.timestamp < periodFinish, "period not finish");
        require(IEpoch(epoch).bond() == bond, "invalid epoch");

        bool inEpoch;
        uint256 i;
        for (; i < epoches.length; i++) {
            if (epoch == epoches[i]) {
                inEpoch = true;
                break;
            }
        }

        uint256[] memory leftRewards = calLeftAwards();
        if (!inEpoch) {
            epoches.push(epoch);
            uint256[] memory newleftRewards = new uint256[](epoches.length);
            for (uint256 j = 0; j < leftRewards.length; j++) {
                newleftRewards[j] = leftRewards[j];
            }
            newleftRewards[leftRewards.length] = reward;

            massUpdatePools(epoches, newleftRewards);
        } else {
            leftRewards[i] += reward;
            massUpdatePools(epoches, leftRewards);
        }

        IERC20(epoch).transferFrom(msg.sender, address(this), reward);
    }

    function removePoolEpoch(address pool, address epoch) external onlyOwner {
        require(block.timestamp > IEpoch(epoch).end() + 180 days, "Can't remove live epoch");
        Pool(pool).remove(epoch);
    }

    function calLeftAwards() internal view returns (uint256[] memory leftRewards) {
        uint256 len = epochRewards.length;
        leftRewards = new uint256[](len);
        if (periodFinish > lastUpdateSecond && block.timestamp < periodFinish) {
            uint256 duration = periodFinish - lastUpdateSecond;
            uint256 passed = block.timestamp - lastUpdateSecond;

            for (uint256 i = 0; i < len; i++) {
                leftRewards[i] = epochRewards[i] - ((passed * epochRewards[i]) / duration);
            }
        }
    }

    function newPool(uint256 _allocPoint, address asset) public onlyOwner {
        require(assetPool[asset] == address(0), "pool exist!");

        address pool = createClone(poolImp);
        Pool(pool).init();

        pools.push(pool);
        allocPoint[pool] = _allocPoint;
        assetPool[asset] = pool;
        totalAllocPoint = totalAllocPoint + _allocPoint;

        emit NewPool(asset, pool);
        uint256[] memory leftRewards = calLeftAwards();
        massUpdatePools(epoches, leftRewards);
    }

    function updatePool(uint256 _allocPoint, address asset) public onlyOwner {
        address pool = assetPool[asset];
        require(pool != address(0), "pool not exist!");

        totalAllocPoint = totalAllocPoint - allocPoint[pool] + _allocPoint;
        allocPoint[pool] = _allocPoint;

        uint256[] memory leftRewards = calLeftAwards();
        massUpdatePools(epoches, leftRewards);
    }

    // _pools need small for gas issue.
    function withdrawAward(address[] memory _pools, address to, bool redeem) external {
        address user = msg.sender;

        uint256 len = _pools.length;
        address[] memory epochs;
        uint256[] memory rewards;
        for (uint256 i = 0; i < len; i++) {
            require(isValidPool(_pools[i]), "Invalid pool");
            (epochs, rewards) = Pool(_pools[i]).withdrawAward(user);
            if (redeem) {
                ISingleBond(bond).redeemOrTransfer(epochs, rewards, to);
            } else {
                ISingleBond(bond).multiTransfer(epochs, rewards, to);
            }
        }

        emit WithdrawAward(user, _pools, redeem);
    }

    function redeemAward(address[] memory _pools, address to) external {
        address user = msg.sender;

        uint256 len = _pools.length;
        address[] memory epochs;
        uint256[] memory rewards;
        for (uint256 i = 0; i < len; i++) {
            require(isValidPool(_pools[i]), "Invalid pool");
            (epochs, rewards) = Pool(_pools[i]).withdrawAward(user);
            ISingleBond(bond).redeem(epochs, rewards, to);
        }
        emit RedeemAward(user, _pools);
    }

    function emergencyWithdraw(address[] memory epochs, uint256[] memory amounts) external onlyOwner {
        require(epochs.length == amounts.length, "mismatch length");

        for (uint256 i = 0; i < epochs.length; i++) {
            IERC20(epochs[i]).transfer(msg.sender, amounts[i]);
        }
        emit EmergencyWithdraw(epochs, amounts);
    }

    function isValidPool(address p) internal view returns (bool valid) {
        uint256 len = pools.length;
        for (uint256 i = 0; i < len; i++) {
            if (p == pools[i]) {
                valid = true;
            }
        }
    }
}
