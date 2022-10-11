npx hardhat --network bsctest verify --contract contracts/vault/SingleFarmingVault.sol:SingleFarmingVault 0x48B8dA0AA56519A32E22adF51baEf344Ba440628
npx hardhat --network bsctest verify --contract contracts/vault/LpFarmingVault.sol:LpFarmingVault 0x4a3245bE6d8Bc4F5F4217421eFF3bB093ec05A61
npx hardhat --network bsctest verify --contract contracts/AppController.sol:AppController 0x21B22823eBd575D8fe79Fef7dE49A57e630e14ac
npx hardhat --network bsctest verify --contract contracts/VaultFactory.sol:VaultFactory 0x022407bfE184A453716861502Cba4914646A760C
npx hardhat --network bsctest verify --contract contracts/DYTokenERC20.sol:DYTokenERC20 0xE3085CD4a1f7D47AA5FdE3019C4C2C907a36Bd8B --constructor-args ./scripts/args-dytoken-template.js
npx hardhat --network bsctest verify --contract ./node_modules/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy --constructor-args ./scripts/args-proxy-template.js
