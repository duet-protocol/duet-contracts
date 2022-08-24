import { ethers, network } from 'hardhat'
import { BondFarmingPool, BondLPFarmingPool, MockBEP20, MockExtendableBond, MultiRewardsMasterChef } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { expectRewards, latestBlockNumber, mineBlocks, ZERO_ADDRESS } from './helpers'
import { BigNumber } from 'bignumber.js'
import { useLogger } from '../scripts/utils'
import { random } from 'lodash'

const logger = useLogger(__filename)
describe('BondFarmingPools', function () {
  let alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress
  let chef: MultiRewardsMasterChef
  let bondToken: MockBEP20
  let bond: MockExtendableBond
  const rewardsPerBlock = parseEther(String(40))
  let bondPool: BondFarmingPool
  let lpPool: BondLPFarmingPool
  let lpToken: MockBEP20
  let treasury: SignerWithAddress

  let bDuetToken: MockBEP20
  const bDUETPerBlock = parseEther('40')
  const bondPerBlock = parseEther('40')
  beforeEach(async () => {
    ;[alice, bob, carol, david, erin, frank] = await ethers.getSigners()
    treasury = alice
    const MultiRewardsMasterChef = await ethers.getContractFactory('MultiRewardsMasterChef')
    const MockBEP20 = await ethers.getContractFactory('MockBEP20')
    const MockExtendableBond = await ethers.getContractFactory('MockExtendableBond')

    bondToken = await MockBEP20.connect(alice).deploy('mocked ebCAKE', 'ebCAKE-mock', parseEther('0'))
    bDuetToken = await MockBEP20.connect(alice).deploy('mocked bDUET', 'bDUET-mock', parseEther('50000000'))
    lpToken = await MockBEP20.connect(alice).deploy('mocked LP token', 'LP-mock', parseEther('10000'))
    bond = await MockExtendableBond.connect(alice).deploy(bondToken.address, rewardsPerBlock)
    chef = await MultiRewardsMasterChef.connect(alice).deploy()
    await chef.connect(alice).initialize(alice.address)
    const BondFarmingPool = await ethers.getContractFactory('BondFarmingPool')
    const BondLPFarmingPool = await ethers.getContractFactory('BondLPFarmingPool')

    bondPool = await BondFarmingPool.connect(alice).deploy()
    await bondPool.connect(alice).initialize(bondToken.address, bond.address, alice.address)
    await bondPool.setMasterChef(chef.address, 0)
    lpPool = await BondLPFarmingPool.connect(alice).deploy()
    await lpPool.connect(alice).initialize(bondToken.address, bond.address, alice.address)
    await lpPool.connect(alice).setLpToken(lpToken.address)
    await lpPool.setMasterChef(chef.address, 1)

    await bondPool.setSiblingPool(lpPool.address)
    await lpPool.setSiblingPool(bondPool.address)

    await bond.setFarmingPool(bondPool.address, lpPool.address)

    await chef.add(1, ZERO_ADDRESS, bondPool.address, true)
    await chef.add(1, ZERO_ADDRESS, lpPool.address, true)

    await bDuetToken.connect(alice).approve(chef.address, parseEther('500000000000000'))
    logger.info('chef.address', chef.address)
    await chef
      .connect(alice)
      .addRewardSpec(
        bDuetToken.address,
        bDUETPerBlock,
        (await latestBlockNumber()) + 100,
        (await latestBlockNumber()) + 200,
      )
  })

  it('stake/unstake, all in bond pool', async () => {
    await bondToken.connect(bob).mintTokens(parseEther('1000'))
    await bondToken.connect(bob).approve(bondPool.address, parseEther('1000'))
    const rewardStartBlock = (await ethers.provider.getBlock('latest')).number + 2
    await chef.setRewardSpec(0, parseEther('40'), rewardStartBlock, 200)
    // logger.info('bond.startBlock()', await bond.startBlock());
    // logger.info('bondToken.totalSupply()', await bondToken.totalSupply());
    // logger.info('bond.totalPendingRewards()', await bond.totalPendingRewards());
    // logger.info('bondPool.totalPendingRewards()', await bondPool.totalPendingRewards());
    await bondPool.connect(bob).stake(parseEther('1000'))
    logger.info('----- bob staked ----')
    const bobUserInfo = await bondPool.usersInfo(bob.address)

    logger.info('carolUserInfo', bobUserInfo)
    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('1000').toString())
    expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('0').toString())
    expect(await bondPool.totalPendingRewards()).equal(parseEther('0').toString())

    const bobStakedBlock = (await ethers.provider.getBlock('latest')).number
    expect(String(await bondToken.balanceOf(bob.address))).equal(parseEther('0').toString())
    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('1000').toString())
    expect(bobUserInfo.shares).equal(parseEther('1000'))
    expect(String(await bondPool.totalShares())).equal(parseEther('1000'))

    await mineBlocks(10, network)

    await bond.updateBondPools()

    await bondToken.connect(carol).mintTokens(parseEther('1000'))
    await bondToken.connect(carol).approve(bondPool.address, parseEther('1000'))
    await bondPool.connect(carol).stake(parseEther('1000'))
    const carolStakedBlock = (await ethers.provider.getBlock('latest')).number
    logger.info('----- carol staked ----')
    let carolUserInfo = await bondPool.usersInfo(carol.address)
    logger.info('bobUserInfo', String(await bondPool.sharesToBondAmount(bobUserInfo.shares)))
    // 999999999999999999999 ≈ 1000 bondToken as decimal issue.
    expect(String(await bondPool.sharesToBondAmount(carolUserInfo.shares))).equal('999999999999999999999')
    await mineBlocks(7, network)
    logger.info(
      'String(await bondToken.balanceOf(bondPool.address))',
      String(await bondToken.balanceOf(bondPool.address)),
    )
    await bondPool.connect(bob).unstakeAll()
    logger.info(
      'String(await bondToken.balanceOf(bondPool.address))',
      String(await bondToken.balanceOf(bondPool.address)),
    )

    let bobLatestBlock = (await ethers.provider.getBlock('latest')).number
    await bondPool.connect(carol).unstakeAll()

    let carolLatestBlock = (await ethers.provider.getBlock('latest')).number
    logger.info('bduet', String(await bDuetToken.balanceOf(bob.address)))
    logger.info('totalShares', await bondPool.totalShares())
    logger.info('totalShares', await bondToken.balanceOf(lpPool.address))

    const bothInPoolBlocks = bobLatestBlock - carolStakedBlock
    const bobAloneBlocks = bobLatestBlock - bobStakedBlock - bothInPoolBlocks
    logger.info('blocks info', {
      bobStakedBlock,
      carolStakedBlock,
      carolLatestBlock,
      bobLatestBlock,
      bothInPoolBlocks,
      bobAloneBlocks,
    })
    const bobShareRatio = new BigNumber(bobUserInfo.shares.toString()).div(
      bobUserInfo.shares.add(carolUserInfo.shares).toString(),
    )

    const bobBduetRewardsAlone = bDUETPerBlock.mul(bobAloneBlocks).div(2)
    const sharedBduetRewardsWithCarol = new BigNumber(bDUETPerBlock.toString())
      .multipliedBy(bothInPoolBlocks)
      .div(2)
      .multipliedBy(bobShareRatio.toString())
    const bobBondRewardsAlone = bondPerBlock.mul(bobAloneBlocks)
    const sharedBondRewardsWithCarol = new BigNumber(bDUETPerBlock.toString())
      .multipliedBy(bothInPoolBlocks)
      .div(2)
      .multipliedBy(bobShareRatio.toString())
    logger.info('rewards', {
      bobRewardsAlone: bobBduetRewardsAlone.toString(),
      sharedRewardsWithCarol: sharedBduetRewardsWithCarol.toString(),
      bobShares: bobUserInfo.shares,
      bobRatio: bobShareRatio.toString(),
      bothInPoolsRewards: bDUETPerBlock.mul(bothInPoolBlocks).div(2).toString(),
      carolShares: carolUserInfo.shares,
    })
    expect((await bDuetToken.balanceOf(bob.address)).div(1e10).toString()).equal(
      bobBduetRewardsAlone.add(sharedBduetRewardsWithCarol.decimalPlaces(0).toString()).div(1e10).toString(),
    )

    expect(String(await bondToken.balanceOf(bondPool.address))).equal(parseEther('0').toString())
    expect(String(await bondPool.totalPendingRewards())).equal(parseEther('0').toString())
    expect(String(await bondPool.totalShares())).equal(parseEther('0').toString())
    logger.log('bond token balance of lpPool', await bondToken.balanceOf(lpPool.address))
  })
  it("should call bondPool.updatePool() before lpPool's", async () => {
    await expect(bond.testInvalidUpdateBondPools()).revertedWith('update bond pool firstly.')
    await bond.updateBondPools()
    // updateBondPools can be called twice in one block (for deposit and stake in one call).
    await expect(bond.updateBondPools()).not.to.be.revertedWith('update bond pool firstly.')
  })
  it('stake/unstake, all in lp pool', async () => {
    await bondToken.connect(alice).mintTokens(parseEther('1000'))

    await lpToken.connect(bob).mintTokens(parseEther('1000'))
    await lpToken.connect(bob).approve(lpPool.address, parseEther('100000000'))
    await lpToken.connect(carol).mintTokens(parseEther('1000'))
    await lpToken.connect(carol).approve(lpPool.address, parseEther('100000000'))
    const rewardStartBlock = (await ethers.provider.getBlock('latest')).number + 3
    await chef.connect(alice).setRewardSpec(0, rewardsPerBlock, rewardStartBlock, 200)
    await bond.connect(alice).setStartBlock(rewardStartBlock)
    await lpPool.connect(bob).stake(parseEther('1000'))
    const bobStakedAtBlock = await latestBlockNumber()
    logger.info('bobStakedAtBlock', { bobStakedAtBlock, rewardStartBlock })
    expect(bobStakedAtBlock, 'make sure reward started at blob staked').equal(rewardStartBlock)
    // random mine blocks
    await mineBlocks(random(0, 5), network)
    await lpPool.connect(carol).stake(parseEther('1000'))
    const carolStakedAtBlock = await latestBlockNumber()
    let bobUserInfo = await lpPool.usersInfo(bob.address)
    let carolUserInfo = await lpPool.usersInfo(carol.address)
    expect(String(bobUserInfo.rewardDebt)).equal('0')
    logger.info('carol debt', carolUserInfo.rewardDebt)
    expect(String(carolUserInfo.rewardDebt)).equal(String(await lpPool.getUserPendingRewards(bob.address)))

    expect(String(await lpToken.balanceOf(bob.address)), 'expect lp balance of bob is zero').equal('0')
    expect(String(await lpToken.balanceOf(carol.address)), 'expect lp balance of carol is zero').equal('0')
    expect(String(await lpToken.balanceOf(lpPool.address)), 'expect lp balance of lp pool added').equal(
      parseEther('2000').toString(),
    )

    expect(bobUserInfo.lpAmount, 'expect lpAmount of bob is 1000').equal(parseEther('1000').toString())
    expect(carolUserInfo.lpAmount, 'expect lpAmount of carol is 1000').equal(parseEther('1000').toString())
    expect(await lpPool.totalLpAmount(), 'expect totalLpAmount is 2000').equal(parseEther('2000').toString())

    await mineBlocks(10, network)

    expect(String(await lpPool.totalPendingRewards())).equal(bondPerBlock.mul(10).toString())
    expect(String(await bondPool.totalPendingRewards())).equal('0')

    await lpPool.connect(bob).unstakeAll()
    const bobUnStakeAtBlock = await latestBlockNumber()
    await lpPool.connect(carol).unstakeAll()
    const carolUnStakeAtBlock = await latestBlockNumber()

    // assert balance of users and pool
    expect(String(await lpToken.balanceOf(bob.address)), 'assert lp balance of bob after unstaked').equal(
      parseEther('1000'),
    )
    expect(String(await lpToken.balanceOf(carol.address)), 'assert lp balance of carol after unstaked').equal(
      parseEther('1000'),
    )
    expect(String(await lpToken.balanceOf(lpPool.address)), 'assert lp balance of lp pool after unstaked').equal(
      parseEther('0'),
    )

    bobUserInfo = await lpPool.usersInfo(bob.address)
    carolUserInfo = await lpPool.usersInfo(carol.address)

    expect(bobUserInfo.lpAmount, 'expect lpAmount of bob is zero after withdrawn').equal(parseEther('0').toString())
    expect(carolUserInfo.lpAmount, 'expect lpAmount of carol is zero after withdrawn').equal(parseEther('0').toString())
    expect(await lpPool.totalLpAmount(), 'expect totalLpAmount is zero after all user withdrawn').equal(
      parseEther('0').toString(),
    )

    expectRewards({
      // Shared rewards with the bond farming pool, so it should be halved
      rewardsPerBlock: rewardsPerBlock.div(2),
      user1StartedAt: bobStakedAtBlock,
      user1EndsAt: bobUnStakeAtBlock,
      user1Rewards: await bDuetToken.balanceOf(bob.address),
      user2StartedAt: carolStakedAtBlock,
      user2EndsAt: carolUnStakeAtBlock,
      user2Rewards: await bDuetToken.balanceOf(carol.address),
      message: 'assert bDUET rewards',
    })
    expect((await bond.mintedRewards()).toString(), 'expect bond rewards').equal(
      new BigNumber(rewardsPerBlock.toString()).multipliedBy(carolUnStakeAtBlock - rewardStartBlock).toString(),
    )
    logger.info('total bond mintedRewards', (await bond.mintedRewards()).toString())
    logger.info('bond.totalPendingRewards()', await bond.totalPendingRewards())
    expectRewards({
      rewardsPerBlock,
      user1StartedAt: bobStakedAtBlock,
      user1EndsAt: bobUnStakeAtBlock,
      user1Rewards: await bondToken.balanceOf(bob.address),
      user2StartedAt: carolStakedAtBlock,
      user2EndsAt: carolUnStakeAtBlock,
      user2Rewards: await bondToken.balanceOf(carol.address),
      message: 'assert bondToken rewards',
    })

    expect(String(await bondToken.balanceOf(lpPool.address)), 'no bond token in lp pool after all lp unstaked').equal(
      '0',
    )
    await expect(lpPool.connect(alice).unstakeAll(), 'unstake without staked').revertedWith('nothing to unstake')

    logger.info('bond.totalPendingRewards', await bond.totalPendingRewards())
    logger.info('lp pool bond token balance', await bondToken.balanceOf(lpPool.address))

    // stake twice
    await lpPool.connect(carol).stake(parseEther('500'))
    await mineBlocks(5, network)
    const carolStakedAgainInfo1 = await lpPool.usersInfo(carol.address)
    logger.info('await lpPool.getUserPendingRewards(carol.address)', await lpPool.getUserPendingRewards(carol.address))
    logger.info('carolStakedAgainInfo1', carolStakedAgainInfo1)
    await lpPool.connect(carol).stake(parseEther('500'))
    await mineBlocks(5, network)
    logger.info('accPerShare', await lpPool.accRewardPerShare())
    logger.info('totalPendingRewards', await lpPool.totalPendingRewards())
    const carolStakedAgainInfo2 = await lpPool.usersInfo(carol.address)
    logger.info('carolStakedAgainInfo2', carolStakedAgainInfo2)
    const carolBondTokenBalanceBeforeUnstake = await bondToken.balanceOf(carol.address)
    await lpPool.connect(carol).unstakeAll()
    const carolUnStakedAgainAt = await latestBlockNumber()

    expectRewards({
      rewardsPerBlock,
      user1StartedAt: carolUnStakeAtBlock,
      user1EndsAt: carolUnStakedAgainAt,
      // subtract previous rewards.
      user1Rewards: (await bondToken.balanceOf(carol.address)).sub(carolBondTokenBalanceBeforeUnstake),
      user2StartedAt: 0,
      user2EndsAt: 0,
      user2Rewards: new BigNumber('0'),
      message: 'assert bondToken rewards',
    })
  })

  it('stake/unstake, both pools', async () => {
    // mock bond token in lp (without staking to any pool)
    await bondToken.connect(alice).mintTokens(parseEther('1000'))

    await bondToken.connect(bob).mintTokens(parseEther('1000'))
    await bondToken.connect(bob).approve(bondPool.address, parseEther('100000000'))
    await lpToken.connect(carol).mintTokens(parseEther('1000'))
    await lpToken.connect(carol).approve(lpPool.address, parseEther('100000000'))
    const rewardStartBlock = (await latestBlockNumber()) + 3
    logger.info('rewardStartBlock', rewardStartBlock)
    await chef.connect(alice).setRewardSpec(0, rewardsPerBlock, rewardStartBlock, rewardStartBlock + 100)
    await bond.connect(alice).setStartBlock(rewardStartBlock)
    await bondPool.connect(bob).stake(parseEther('500'))
    await mineBlocks(5, network)
    const bobUserInfo = await bondPool.usersInfo(bob.address)
    const bobAmountFirstTime = new BigNumber(parseEther('500').toString())
      .div((await bondToken.totalSupply()).toString())
      .multipliedBy(new BigNumber(rewardsPerBlock.toString()).multipliedBy(5))
      .plus(parseEther('500').toString())
    expect(String(await bondPool.sharesToBondAmount(bobUserInfo.shares))).equal(bobAmountFirstTime.toString())

    await lpPool.connect(carol).stake(parseEther('500'))
    expect(String(await bondPool.sharesToBondAmount(bobUserInfo.shares))).equal(parseEther('560'))
    expect(String(await lpPool.getUserPendingRewards(carol.address))).equal(parseEther('180'))

    logger.info('await bondToken.totalSupply()', await bondToken.totalSupply())

    logger.info('await bond.mintedRewards()', await bond.mintedRewards())
    logger.info('await bond.totalPendingRewards()', await bond.totalPendingRewards())
    expect(String((await bond.mintedRewards()).add(await bond.totalPendingRewards()))).equal(
      parseEther(String(560 - 500 + 180)).toString(),
    )
  })
})
