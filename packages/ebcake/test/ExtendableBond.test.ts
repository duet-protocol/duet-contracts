import { parseEther } from 'ethers/lib/utils';
import { ethers, network, upgrades } from 'hardhat';
import {
  BondToken,
  CakePool,
  ExtendableBond,
  MasterChef,
  MasterChefV2,
  MockERC20,
  MockIBondFarmingPool,
  SyrupBar,
} from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { setBlockTimestampTo } from './helpers';

// const MockBEP20 = artifacts.readArtifactSync("./libs/MockBEP20.sol");

describe('ExtendableBond', function () {
  let alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress;
  let cakeToken: MockERC20;
  let cakeMasterChefV2: MasterChefV2;
  let masterChef: MasterChef;
  let cakePool: CakePool;
  let extendableBond: ExtendableBond;
  let bondToken: BondToken;
  let pancakeSyrupBar: SyrupBar;
  let bondPool: MockIBondFarmingPool;
  let lpPool: MockIBondFarmingPool;

  const CAKE_POOL_ID = 0;
  beforeEach(async () => {
    [alice, bob, carol, david, erin, frank] = await ethers.getSigners();
    const CakeTokenContract = await ethers.getContractFactory('MockERC20');
    cakeToken = await CakeTokenContract.connect(alice).deploy('Mocked CAKE', 'MCAKE', parseEther('10000'), 18);
    bondToken = await (await ethers.getContractFactory('BondToken'))
      .connect(alice)
      .deploy('Mocked ebCAKE', 'ebCAKE-mock', alice.address);
    await cakeToken.connect(bob).mintTokens(parseEther('10000'));
    await cakeToken.connect(carol).mintTokens(parseEther('10000'));
    await cakeToken.connect(david).mintTokens(parseEther('10000'));
    await cakeToken.connect(erin).mintTokens(parseEther('10000'));
    await cakeToken.connect(frank).mintTokens(parseEther('10000'));

    const SyrupBarContract = await ethers.getContractFactory('SyrupBar');
    pancakeSyrupBar = await SyrupBarContract.connect(alice).deploy(cakeToken.address);
    const MasterChefContract = await ethers.getContractFactory('MasterChef');
    // CakeToken _cake,
    //   SyrupBar _syrup,
    //   address _devaddr,
    //   uint256 _cakePerBlock,
    //   uint256 _startBlock
    masterChef = await MasterChefContract.deploy(
      cakeToken.address,
      pancakeSyrupBar.address,
      alice.address,
      parseEther('40'),
      0,
    );
    const CakeMasterChefV2Contract = await ethers.getContractFactory('MasterChefV2');
    const MockIBondFarmingPool = await ethers.getContractFactory('MockIBondFarmingPool');
    bondPool = await MockIBondFarmingPool.connect(alice).deploy(bondToken.address);
    lpPool = await MockIBondFarmingPool.connect(alice).deploy(bondToken.address);
    console.log('masterChef.poolLength()', await masterChef.poolLength());
    cakeMasterChefV2 = await CakeMasterChefV2Contract.connect(alice).deploy(
      masterChef.address,
      cakeToken.address,
      1,
      alice.address,
    );
    // for MasterChefV2
    const dMasterCefV2 = await CakeTokenContract.connect(alice).deploy(
      'Mocked dCAKEPOOL',
      'dCAKEPOOL',
      parseEther('10'),
      18,
    );

    const dCAKEPOOL = await CakeTokenContract.connect(alice).deploy(
      'Mocked dCAKEPOOL',
      'dCAKEPOOL',
      parseEther('10'),
      18,
    );

    await dMasterCefV2.connect(alice).approve(cakeMasterChefV2.address, parseEther('10'));
    // await dCAKEPOOL.connect(alice).transfer(cakeMasterChefV2.address, parseEther('10'));
    await masterChef.connect(alice).set(0, 0, true);
    await masterChef.connect(alice).add(1, dMasterCefV2.address, true);
    console.log('masterChefv2 pool length', await cakeMasterChefV2.poolLength());
    await cakeMasterChefV2.connect(alice).init(dMasterCefV2.address);
    await cakeToken.connect(alice).transfer(cakeMasterChefV2.address, parseEther('10000'));
    // console.log('pool info', await cakeMasterChefV2.poolInfo(0));

    const CakePoolContract = await ethers.getContractFactory('CakePool');
    console.log('hello:80');
    await cakeMasterChefV2.add(1, dCAKEPOOL.address, false, true);
    cakePool = await CakePoolContract.connect(alice).deploy(
      cakeToken.address,
      cakeMasterChefV2.address,
      alice.address,
      alice.address,
      alice.address,
      CAKE_POOL_ID,
    );

    await cakeMasterChefV2.updateWhiteList(cakePool.address, true);
    await dCAKEPOOL.connect(alice).approve(cakePool.address, parseEther('10'));
    // await dCAKEPOOL.connect(alice).transfer(cakeMasterChefV2.address, parseEther('10'));
    // await cakeMasterChefV2.connect(alice).set(0, 1, true);
    await cakePool.init(dCAKEPOOL.address);

    const ExtendableBondContract = await ethers.getContractFactory('ExtendableBond');
    // BondToken bondToken_,
    //   ICakePool cakePool_,
    //   IERC20Upgradeable underlyingToken_,
    //   address admin_
    extendableBond = (await upgrades.deployProxy(ExtendableBondContract, [
      bondToken.address,
      cakeToken.address,
      cakePool.address,
      alice.address,
    ])) as ExtendableBond;

    // // BondToken bondToken_,
    // //   ICakePool cakePool_,
    // //   IERC20Upgradeable underlyingToken_,
    // //   address admin_
    // await extendableBond.connect(alice).initialize(
    //   bondToken.address,
    //   cakeToken.address,
    //   cakePool.address,
    //   alice.address,
    //   // alice.address,
    // );
    await extendableBond.connect(alice).setFarmingPools(bondPool.address, lpPool.address);
    await bondToken.connect(alice).setMinter(extendableBond.address);
  });

  it('convert and redeem', async () => {
    const now = Math.floor(new Date().getTime() / 1000);
    await extendableBond.connect(alice).updateCheckPoints({
      convertable: true,
      convertableFrom: now,
      convertableEnd: now + 86400,
      redeemable: true,
      redeemableFrom: now + 86400 * 8 + 10,
      redeemableEnd: now + 86400 * 9,
      maturity: now + 86400 * 8,
    });
    await network.provider.send('evm_increaseTime', [21]);
    await network.provider.send('evm_mine');
    await cakeToken.connect(bob).approve(extendableBond.address, parseEther('10000'));
    console.log('cakeMasterChefV2.BOOST_PRECISION', await cakeMasterChefV2.BOOST_PRECISION());
    console.log('cakeMasterChefV2.ACC_CAKE_PRECISION', await cakeMasterChefV2.ACC_CAKE_PRECISION());
    console.log(' await cakeMasterChefV2.poolLength', await cakeMasterChefV2.poolLength());
    console.log(' await cakeMasterChefV2.poolInfo(0)', await cakeMasterChefV2.poolInfo(0));
    console.log(
      ' await cakeMasterChefV2.pendingCake(0, cakePool.address)',
      await cakeMasterChefV2.pendingCake(0, cakePool.address),
    );
    await cakeToken.mint(cakeMasterChefV2.address, parseEther('20000'));
    await extendableBond.connect(bob).convert(parseEther('10000'));
    await expect(String(await cakeToken.balanceOf(bob.address))).equal(parseEther('0'));
    await expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('10000'));
    await expect(String(await cakeToken.balanceOf(extendableBond.address))).equal(parseEther('0'));
    await expect(extendableBond.connect(bob).redeemAll()).revertedWith('Can not redeem.');
    await setBlockTimestampTo(now + 86400 * 8 + 10);
    await extendableBond.connect(bob).redeemAll();
    await expect(String(await cakeToken.balanceOf(bob.address))).equal(parseEther('10000'));
    await expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('0'));
  });
});
