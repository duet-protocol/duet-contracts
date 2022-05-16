import { ethers, network } from 'hardhat';
import { MockBEP20, MultiRewardsMasterChef } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { expect } from 'chai';
import { mineBlocks, ZERO_ADDRESS } from './helpers';

describe('MultiRewardsMasterChef', function () {
  let lp1: MockBEP20, lp2: MockBEP20, lp3: MockBEP20, chef: MultiRewardsMasterChef;
  let reward1: MockBEP20, reward2: MockBEP20;
  let minter: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress;
  beforeEach(async () => {
    [minter, alice, bob, carol, david, erin, frank] = await ethers.getSigners();

    const MultiRewardsMasterChef = await ethers.getContractFactory('MultiRewardsMasterChef');
    const MockBEP20 = await ethers.getContractFactory('MockBEP20');
    lp1 = await MockBEP20.connect(minter).deploy('LPToken', 'LP1', parseEther('10000'));
    lp2 = await MockBEP20.connect(minter).deploy('LPToken', 'LP2', parseEther('10000'));
    lp3 = await MockBEP20.connect(minter).deploy('LPToken', 'LP3', parseEther('10000'));

    chef = await MultiRewardsMasterChef.connect(minter).deploy();
    await chef.connect(minter).initialize(minter.address);

    reward1 = await MockBEP20.connect(minter).deploy('RewardToken', 'Reward1', parseEther('10000'));
    reward2 = await MockBEP20.connect(minter).deploy('RewardToken', 'Reward2', parseEther('10000'));

    await lp1.connect(minter).transfer(bob.address, parseEther('200'));
    await lp2.connect(minter).transfer(bob.address, parseEther('200'));
    await lp3.connect(minter).transfer(bob.address, parseEther('200'));

    await lp1.connect(minter).transfer(carol.address, parseEther('200'));
    await lp2.connect(minter).transfer(carol.address, parseEther('200'));
    await lp3.connect(minter).transfer(carol.address, parseEther('200'));
  });

  it('manipulate pool and reward spec', async () => {
    await expect(chef.connect(bob).add('2000', lp1.address, ZERO_ADDRESS, true)).revertedWith('Only admin');
    await chef.connect(minter).add('2000', lp1.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('1000', lp2.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('100', lp3.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('100', lp3.address, ZERO_ADDRESS, true);

    expect((await chef.poolLength()).toString()).to.be.equal('9');

    expect(await chef.totalAllocPoint()).equal('5700');
    expect((await chef.poolInfo('0')).allocPoint).equal('2000');

    expect(await reward1.balanceOf(minter.address)).equal(parseEther('10000'));
    expect(await reward1.balanceOf(chef.address)).equal(parseEther('0'));

    await reward1.connect(minter).approve(chef.address, parseEther('10000'));
    const reward1StartBlock = (await ethers.provider.getBlock('latest')).number;
    await chef
      .connect(minter)
      .addRewardSpec(reward1.address, parseEther('50'), reward1StartBlock, reward1StartBlock + 8);
    expect((await reward1.balanceOf(minter.address)).toString()).equal(parseEther('9600').toString());
    expect((await reward1.balanceOf(chef.address)).toString()).equal(parseEther('400').toString());

    expect(await reward2.balanceOf(minter.address)).equal(parseEther('10000'));
    expect(await reward2.balanceOf(chef.address)).equal(parseEther('0'));
    await reward2.connect(minter).approve(chef.address, parseEther('10000'));
    const reward2StartBlock = (await ethers.provider.getBlock('latest')).number;
    await chef
      .connect(minter)
      .addRewardSpec(reward2.address, parseEther('60'), reward2StartBlock, reward2StartBlock + 9);
    await expect(
      chef.connect(minter).setRewardSpec(1, parseEther('60'), reward2StartBlock - 1, reward2StartBlock + 9),
    ).revertedWith('can not modify startedAtBlock after rewards has began allocating');
    await expect(chef.connect(minter).setRewardSpec(1, parseEther('60'), reward2StartBlock, 1)).revertedWith(
      'can not modify endedAtBlock to a past block number',
    );

    expect((await reward2.balanceOf(minter.address)).toString()).equal(parseEther('9460').toString());
    expect((await reward2.balanceOf(chef.address)).toString()).equal(parseEther('540').toString());
  });

  async function preparePools() {
    await chef.connect(minter).add('500', lp1.address, ZERO_ADDRESS, true);
    await chef.connect(minter).add('500', lp2.address, ZERO_ADDRESS, true);
    await expect(chef.connect(minter).add('500', lp3.address, david.address, true)).revertedWith(
      'LPToken should be address 0 when proxied farmer.',
    );
    await chef.connect(minter).add('500', ZERO_ADDRESS, david.address, true);

    await reward1.connect(minter).approve(chef.address, parseEther((8 * 50).toString()));

    await reward1.connect(minter).approve(chef.address, parseEther('10000').toString());
    const reward1StartBlock = (await ethers.provider.getBlock('latest')).number;
    await chef
      .connect(minter)
      .addRewardSpec(reward1.address, parseEther('30'), reward1StartBlock, reward1StartBlock + 20);
    const reward2StartBlock = (await ethers.provider.getBlock('latest')).number;
    await reward2.connect(minter).approve(chef.address, parseEther('10000').toString());
    await chef
      .connect(minter)
      .addRewardSpec(reward2.address, parseEther('60'), reward2StartBlock, reward2StartBlock + 30);
  }

  it('deposit/withdraw', async () => {
    await preparePools();

    await lp1.connect(bob).approve(chef.address, parseEther('1000'));
    await chef.connect(bob).deposit('0', parseEther('200'));
    const bobDepositedBlock = (await ethers.provider.getBlock('latest')).number;
    expect((await lp1.balanceOf(bob.address)).toString()).equal(parseEther('0').toString());
    expect((await lp1.balanceOf(chef.address)).toString()).equal(parseEther('200').toString());
    expect((await chef.poolInfo('0')).totalAmount.toString()).equal(parseEther('200').toString());

    let [reward1Info, reward2Info] = await chef.pendingRewards('0', bob.address);
    expect(reward1Info.token).equal(reward1.address);
    expect(reward1Info.amount.toString()).equal(parseEther('0'));
    expect(reward2Info.token).equal(reward2.address);
    expect(reward2Info.amount.toString()).equal(parseEther('0'));
    // await time.advanceBlockTo(String(reward1StartBlock + 20));

    await mineBlocks(10, network);
    [reward1Info, reward2Info] = await chef.pendingRewards('0', bob.address);
    expect(reward1Info.amount.toString()).equal(parseEther('100'));
    expect(reward2Info.amount.toString()).equal(parseEther('200'));

    expect(String(await reward1.balanceOf(bob.address))).equal(parseEther('0'));
    expect(String(await reward2.balanceOf(bob.address))).equal(parseEther('0'));
    await expect(chef.connect(bob).withdraw('0', parseEther('200.1'))).revertedWith('withdraw: Insufficient balance');
    await chef.connect(bob).withdraw('0', parseEther('200'));
    expect(String(await lp1.balanceOf(chef.address))).equal(parseEther('0'));
    expect(String(await lp1.balanceOf(bob.address))).equal(parseEther('200'));
    const latestBlock = (await ethers.provider.getBlock('latest')).number;
    expect(String(await reward1.balanceOf(bob.address))).equal(
      parseEther(String((latestBlock - bobDepositedBlock) * 10)),
    );
    expect(String(await reward2.balanceOf(bob.address))).equal(
      parseEther(String((latestBlock - bobDepositedBlock) * 20)),
    );
  });

  it('deposit/withdraw proxy farmer', async () => {
    await preparePools();

    await expect(chef.connect(bob).depositForUser('0', parseEther('200'), alice.address)).to.be.revertedWith(
      'Can not deposit for others',
    );

    await expect(chef.connect(bob).deposit('2', parseEther('100'))).revertedWith('Only proxy farmer');

    expect(String(await lp3.allowance(david.address, chef.address))).equal(parseEther('0'));
    expect(String(await lp3.allowance(carol.address, chef.address))).equal(parseEther('0'));
    expect((await lp3.balanceOf(david.address)).toString()).equal(parseEther('0').toString());
    await chef.connect(david).depositForUser('2', parseEther('200'), carol.address);
    const depositedBlock = (await ethers.provider.getBlock('latest')).number;
    let [reward1Info, reward2Info] = await chef.pendingRewards('2', carol.address);
    expect(reward1Info.token).equal(reward1.address);
    expect(reward1Info.amount.toString()).equal(parseEther('0'));
    expect(reward2Info.token).equal(reward2.address);
    expect(reward2Info.amount.toString()).equal(parseEther('0'));
    expect((await lp3.balanceOf(carol.address)).toString()).equal(parseEther('200').toString());
    expect((await lp3.balanceOf(david.address)).toString()).equal(parseEther('0').toString());
    expect((await lp3.balanceOf(chef.address)).toString()).equal(parseEther('0').toString());
    expect((await chef.poolInfo('2')).totalAmount.toString()).equal(parseEther('200').toString());
    await mineBlocks(10, network);
    [reward1Info, reward2Info] = await chef.pendingRewards('2', carol.address);
    expect(reward1Info.amount.toString()).equal(parseEther('100'));
    expect(reward2Info.amount.toString()).equal(parseEther('200'));
    expect(String(await reward1.balanceOf(frank.address))).equal(parseEther('0'));
    expect(String(await reward2.balanceOf(bob.address))).equal(parseEther('0'));
    await expect(chef.connect(carol).withdraw('2', parseEther('200'))).revertedWith('Only proxy farmer');
    await chef.connect(david).withdrawForUser('2', parseEther('200'), carol.address);
    const latestBlock = (await ethers.provider.getBlock('latest')).number;
    expect(String(await reward1.balanceOf(carol.address))).equal(
      parseEther(String((latestBlock - depositedBlock) * 10)),
    );
    expect(String(await reward2.balanceOf(carol.address))).equal(
      parseEther(String((latestBlock - depositedBlock) * 20)),
    );
  });
});
