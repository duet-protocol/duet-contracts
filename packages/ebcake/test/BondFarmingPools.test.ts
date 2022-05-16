import { ethers, network } from 'hardhat';
import {
  BondFarmingPool,
  BondLPFarmingPool,
  MockBEP20,
  MockExtendableBond,
  MultiRewardsMasterChef,
} from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { expect } from 'chai';
import { mineBlocks, ZERO_ADDRESS } from './helpers';
import chalk from 'chalk';
import { BigNumber } from 'bignumber.js';

// const chalk = new Chalk();
console.info = (message?: any, ...optionalParams: any[]) => {
  console.log(chalk.cyan(String(message)), ...optionalParams);
};
describe('BondFarmingPools', function () {
  let alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress;
  let chef: MultiRewardsMasterChef;
  let bondToken: MockBEP20;
  let bond: MockExtendableBond;
  let bondPool: BondFarmingPool;
  let lpPool: BondLPFarmingPool;
  let lpToken: MockBEP20;
  let treasury: SignerWithAddress;

  let bDuetToken: MockBEP20;
  const bDUETPerBlock = parseEther('40');
  const bondPerBlock = parseEther('40');
  beforeEach(async () => {
    [alice, bob, carol, david, erin, frank] = await ethers.getSigners();
    treasury = alice;
    const MultiRewardsMasterChef = await ethers.getContractFactory('MultiRewardsMasterChef');
    const MockBEP20 = await ethers.getContractFactory('MockBEP20');
    const MockExtendableBond = await ethers.getContractFactory('MockExtendableBond');

    bondToken = await MockBEP20.connect(alice).deploy('mocked ebCAKE', 'ebCAKE-mock', parseEther('0'));
    bDuetToken = await MockBEP20.connect(alice).deploy('mocked bDUET', 'bDUET-mock', parseEther('500000'));
    lpToken = await MockBEP20.connect(alice).deploy('mocked LP token', 'LP-mock', parseEther('10000'));
    bond = await MockExtendableBond.connect(alice).deploy(bondToken.address);
    chef = await MultiRewardsMasterChef.connect(alice).deploy();
    await chef.connect(alice).initialize(alice.address);
    const BondFarmingPool = await ethers.getContractFactory('BondFarmingPool');
    const BondLPFarmingPool = await ethers.getContractFactory('BondLPFarmingPool');

    bondPool = await BondFarmingPool.connect(alice).deploy(bondToken.address, bond.address);
    bondPool.setMasterChef(chef.address, 0);
    lpPool = await BondLPFarmingPool.connect(alice).deploy(bondToken.address, bond.address);
    await lpPool.connect(alice).setLpToken(lpToken.address);
    lpPool.setMasterChef(chef.address, 1);

    bondPool.setSiblingPool(lpPool.address);
    lpPool.setSiblingPool(bondPool.address);

    await bond.setFarmingPool(bondPool.address, lpPool.address);

    await chef.add(1, ZERO_ADDRESS, bondPool.address, true);
    await chef.add(1, ZERO_ADDRESS, lpPool.address, true);

    await bDuetToken.connect(alice).approve(chef.address, parseEther('500000'));
    await chef.connect(alice).addRewardSpec(bDuetToken.address, bDUETPerBlock, 100, 200);
  });

  it('stake/unstake, all in bond pool', async () => {
    await bondToken.connect(bob).mintTokens(parseEther('1000'));
    await bondToken.connect(bob).approve(bondPool.address, parseEther('1000'));
    const rewardStartBlock = (await ethers.provider.getBlock('latest')).number + 2;
    await chef.setRewardSpec(0, parseEther('40'), rewardStartBlock, 200);
    // console.info('bond.startBlock()', await bond.startBlock());
    // console.info('bondToken.totalSupply()', await bondToken.totalSupply());
    // console.info('bond.totalPendingRewards()', await bond.totalPendingRewards());
    // console.info('bondPool.totalPendingRewards()', await bondPool.totalPendingRewards());
    await bondPool.connect(bob).stake(parseEther('1000'));
    console.info('----- bob staked ----');
    const bobUserInfo = await bondPool.usersInfo(bob.address);

    console.info('carolUserInfo', bobUserInfo);
    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('1000').toString());
    expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('0').toString());
    expect(await bondPool.totalPendingRewards()).equal(parseEther('0').toString());

    const bobStakedBlock = (await ethers.provider.getBlock('latest')).number;
    expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('0').toString());
    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('1000').toString());
    expect(bobUserInfo.shares).equal(parseEther('1000'));
    expect(String(await bondPool.totalShares())).equal(parseEther('1000'));

    await mineBlocks(10, network);

    await bond.updateBondPools();

    await bondToken.connect(carol).mintTokens(parseEther('1000'));
    await bondToken.connect(carol).approve(bondPool.address, parseEther('1000'));
    await bondPool.connect(carol).stake(parseEther('1000'));
    const carolStakedBlock = (await ethers.provider.getBlock('latest')).number;
    console.info('----- carol staked ----');
    let carolUserInfo = await bondPool.usersInfo(carol.address);
    // 999999999999999999999 ≈ 1000 bondToken as decimal issue.
    expect(String(await bondPool.sharesToBondAmount(carolUserInfo.shares))).equal('999999999999999999999');
    await mineBlocks(7, network);
    console.info(
      'String(await bondToken.balanceOf(bondPool.address))',
      String(await bondToken.balanceOf(bondPool.address)),
    );
    await bondPool.connect(bob).unstakeAll();
    console.info(
      'String(await bondToken.balanceOf(bondPool.address))',
      String(await bondToken.balanceOf(bondPool.address)),
    );

    let bobLatestBlock = (await ethers.provider.getBlock('latest')).number;
    await bondPool.connect(carol).unstakeAll();

    let carolLatestBlock = (await ethers.provider.getBlock('latest')).number;
    console.info('bduet', String(await bDuetToken.balanceOf(bob.address)));
    console.info('totalShares', await bondPool.totalShares());
    console.info('totalShares', await bondToken.balanceOf(lpPool.address));

    const bothInPoolBlocks = bobLatestBlock - carolStakedBlock;
    const bobAloneBlocks = bobLatestBlock - bobStakedBlock - bothInPoolBlocks;
    console.info('blocks info', {
      bobStakedBlock,
      carolStakedBlock,
      carolLatestBlock,
      bobLatestBlock,
      bothInPoolBlocks,
      bobAloneBlocks,
    });
    const bobShareRatio = new BigNumber(bobUserInfo.shares.toString()).div(
      bobUserInfo.shares.add(carolUserInfo.shares).toString(),
    );

    const bobBduetRewardsAlone = bDUETPerBlock.mul(bobAloneBlocks).div(2);
    const sharedBduetRewardsWithCarol = new BigNumber(bDUETPerBlock.toString())
      .multipliedBy(bothInPoolBlocks)
      .div(2)
      .multipliedBy(bobShareRatio.toString());
    const bobBondRewardsAlone = bondPerBlock.mul(bobAloneBlocks);
    const sharedBondRewardsWithCarol = new BigNumber(bDUETPerBlock.toString())
      .multipliedBy(bothInPoolBlocks)
      .div(2)
      .multipliedBy(bobShareRatio.toString());
    console.info('rewards', {
      bobRewardsAlone: bobBduetRewardsAlone.toString(),
      sharedRewardsWithCarol: sharedBduetRewardsWithCarol.toString(),
      bobShares: bobUserInfo.shares,
      bobRatio: bobShareRatio.toString(),
      bothInPoolsRewards: bDUETPerBlock.mul(bothInPoolBlocks).div(2).toString(),
      carolShares: carolUserInfo.shares,
    });
    expect((await bDuetToken.balanceOf(bob.address)).div(1e10).toString()).equal(
      bobBduetRewardsAlone.add(sharedBduetRewardsWithCarol.decimalPlaces(0).toString()).div(1e10).toString(),
    );

    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('0').toString());
    expect(String(await bondPool.totalPendingRewards())).equal(parseEther('0').toString());
    expect(String(await bondPool.totalShares())).equal(parseEther('0').toString());
    console.log('bond token balance of lpPool', await bondToken.balanceOf(lpPool.address));
  });
  it("should call bondPool.updatePool() before lpPool's", async () => {
    await expect(bond.testInvalidUpdateBondPools()).revertedWith('update bond pool firstly.');
    await bond.updateBondPools();
    // updateBondPools can be called twice in one block (for deposit and stake in one call).
    await expect(bond.updateBondPools()).not.to.be.revertedWith('update bond pool firstly.');
  });
  it('stake/unstake, all in lp pool', async () => {
    await bondToken.connect(alice).mintTokens(parseEther('1000'));

    await lpToken.connect(bob).mintTokens(parseEther('1000'));
    await lpToken.connect(bob).approve(lpPool.address, parseEther('1000'));
    await lpToken.connect(carol).mintTokens(parseEther('1000'));
    await lpToken.connect(carol).approve(lpPool.address, parseEther('1000'));
    const rewardStartBlock = (await ethers.provider.getBlock('latest')).number + 2;
    await chef.connect(alice).setRewardSpec(0, parseEther('40'), rewardStartBlock, 200);
    await lpPool.connect(bob).stake(parseEther('1000'));
    await lpPool.connect(carol).stake(parseEther('1000'));

    expect(String(await lpToken.balanceOf(bob.address))).equal('0');
    expect(String(await lpToken.balanceOf(carol.address))).equal('0');
    expect(String(await lpToken.balanceOf(lpPool.address))).equal(parseEther('2000'));

    let bobUserInfo = await lpPool.usersInfo(bob.address);
    let carolUserInfo = await lpPool.usersInfo(carol.address);

    expect(bobUserInfo.lpAmount).equal(parseEther('1000').toString());
    expect(carolUserInfo.lpAmount).equal(parseEther('1000').toString());

    await mineBlocks(10, network);

    expect(String(await lpPool.totalPendingRewards())).equal(bondPerBlock.mul(10).toString());
    expect(String(await bondPool.totalPendingRewards())).equal('0');

    await lpPool.connect(bob).unstakeAll();
    await lpPool.connect(carol).unstakeAll();

    expect(String(await lpToken.balanceOf(bob.address))).equal(parseEther('1000'));
    expect(String(await lpToken.balanceOf(carol.address))).equal(parseEther('1000'));
    expect(String(await lpToken.balanceOf(lpPool.address))).equal(parseEther('0'));

    bobUserInfo = await lpPool.usersInfo(bob.address);
    carolUserInfo = await lpPool.usersInfo(carol.address);

    expect(bobUserInfo.lpAmount).equal(parseEther('0').toString());
    expect(carolUserInfo.lpAmount).equal(parseEther('0').toString());

    expect(String(await bDuetToken.balanceOf(bob.address))).equal(parseEther('130'));
    expect(String(await bDuetToken.balanceOf(carol.address))).equal(parseEther('130'));

    expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('260'));
    expect(String(await bondToken.balanceOf(carol.address))).equal(parseEther('300'));

    await expect(lpPool.connect(alice).unstakeAll()).revertedWith('nothing to unstake');
  });
});
