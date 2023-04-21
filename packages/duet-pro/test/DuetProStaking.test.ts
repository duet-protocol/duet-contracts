import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { DuetProStaking, MockBoosterOracle, MockDeriLensAndPool, MockERC20 } from '../typechain'
import { useLogger } from '@private/shared/scripts/utils'
import { latestBlockNumber, latestTimestamp, parseOjWithBigNumber } from '@private/shared/scripts/test-helpers'
import { BigNumber, BigNumberish } from 'ethers'

const logger = useLogger(__filename)
describe('DuetProStaking', function () {
  let minter: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress,
    accounts: SignerWithAddress[]
  let staking: DuetProStaking
  let lensPool: MockDeriLensAndPool
  let booster1: MockERC20
  let booster2: MockERC20
  let booster3: MockERC20

  let usdc: MockERC20
  let boosterOracle: MockBoosterOracle
  beforeEach(async () => {
    ;[minter, bob, carol, david, erin, frank, ...accounts] = await ethers.getSigners()
    lensPool = await (await ethers.getContractFactory('MockDeriLensAndPool')).connect(minter).deploy()

    // init mock tokens
    booster1 = await (await ethers.getContractFactory('MockERC20'))
      .connect(minter)
      .deploy('Booster1', 'BOOST', ethers.utils.parseEther('100000'), 18)
    await booster1.connect(minter).transfer(bob.address, ethers.utils.parseEther('10000'))
    await booster1.connect(minter).transfer(carol.address, ethers.utils.parseEther('10000'))

    booster2 = await (await ethers.getContractFactory('MockERC20'))
      .connect(minter)
      .deploy('Booster2', 'BOOST2', ethers.utils.parseEther('100000'), 18)
    await booster2.connect(minter).transfer(bob.address, ethers.utils.parseEther('10000'))
    await booster2.connect(minter).transfer(carol.address, ethers.utils.parseEther('10000'))
    booster3 = await (await ethers.getContractFactory('MockERC20'))
      .connect(minter)
      .deploy('Booster3', 'BOOST3', ethers.utils.parseEther('100000'), 18)
    usdc = await (await ethers.getContractFactory('MockERC20'))
      .connect(minter)
      .deploy('Mock USDC', 'M-USDC', 10000 * Math.pow(10, 6), 6)
    await usdc.connect(minter).transfer(bob.address, 1000 * Math.pow(10, 6))
    await usdc.connect(minter).transfer(carol.address, 1000 * Math.pow(10, 6))
    await usdc.connect(minter).transfer(david.address, 1000 * Math.pow(10, 6))

    // init staking
    staking = await (await ethers.getContractFactory('DuetProStaking')).connect(minter).deploy()
    boosterOracle = await (await ethers.getContractFactory('MockBoosterOracle')).connect(minter).deploy()
    await staking
      .connect(minter)
      .initialize(lensPool.address, lensPool.address, usdc.address, boosterOracle.address, minter.address)
    await staking.connect(minter).addSupportedBooster(booster1.address)
    await staking.connect(minter).addSupportedBooster(booster2.address)
  })

  async function assertUserStakeBooster(
    booster: MockERC20,
    stakeAmount: BigNumberish,
    user: SignerWithAddress,
    username: string,
    price: number,
    sequence = 0,
  ) {
    await boosterOracle.setPrice(BigNumber.from(price * 1e8))
    const stakeValue = BigNumber.from(stakeAmount)
      .mul(price * 1e8)
      .div(1e8)
    // approve
    await booster.connect(user).approve(staking.address, stakeAmount)
    const previousUserInfo = await staking.connect(user).userInfos(user.address)
    const previousUserStakedBoosterAmount = await staking.connect(user).userStakedBooster(user.address, booster.address)
    const previousTotalStakedBoosterAmount = await staking.connect(user).totalStakedBoosterAmount()
    const previousTotalStakedBoosterValue = await staking.connect(user).totalStakedBoosterValue()
    const previousUserBalance = await booster.connect(user).balanceOf(user.address)
    const previousPoolBalance = await booster.connect(user).balanceOf(staking.address)

    // stake booster
    await staking.connect(user).stakeBooster(booster.address, stakeAmount)
    const userInfo = await staking.connect(user).userInfos(user.address)
    expect(userInfo.stakedBoosterAmount).to.equal(
      previousUserInfo.stakedBoosterAmount.add(stakeAmount),
      `${username} staked ${await booster.name()} amount, sequence ${sequence}`,
    )
    expect(userInfo.stakedBoosterValue).to.equal(
      previousUserInfo.stakedBoosterValue.add(stakeValue),
      `${username} staked ${await booster.name()} value, sequence ${sequence}`,
    )
    expect(userInfo.lastActionTime.toNumber()).to.equal(
      await latestTimestamp(),
      `${username} lastActionTime, sequence ${sequence}`,
    )
    expect(userInfo.lastActionBlock.toNumber()).to.equal(
      await latestBlockNumber(),
      `${username} lastActionBlock, sequence ${sequence}}`,
    )

    expect(await staking.connect(user).userStakedBooster(user.address, booster.address)).to.equal(
      previousUserStakedBoosterAmount.add(stakeAmount),
      `userStakedBooster ${await booster.name()}, sequence ${sequence}}`,
    )

    expect(await staking.connect(user).totalStakedBoosterAmount()).equal(
      previousTotalStakedBoosterAmount.add(stakeAmount),
      `total staked booster amount, sequence ${sequence}`,
    )
    expect(await staking.connect(user).totalStakedBoosterValue()).equal(
      previousTotalStakedBoosterValue.add(stakeValue),

      `total staked booster value ${sequence}`,
    )
    expect(await booster.connect(user).balanceOf(user.address)).to.equal(
      previousUserBalance.sub(stakeAmount),
      `${username} balance, sequence ${sequence}`,
    )
    expect(await booster.connect(user).balanceOf(staking.address)).to.equal(
      previousPoolBalance.add(stakeAmount),
      `Staking booster balance, sequence ${sequence}`,
    )
  }

  async function assertUserUnstakeBooster(
    booster: MockERC20,
    unstakeAmount: BigNumberish,
    user: SignerWithAddress,
    username: string,
    price: number,
    sequence = 0,
  ) {
    await boosterOracle.setPrice(BigNumber.from(price * 1e8))
    const unstakeValue = BigNumber.from(unstakeAmount)
      .mul(price * 1e8)
      .div(1e8)
    const previousUserInfo = await staking.connect(user).userInfos(user.address)
    const previousUserStakedBoosterAmount = await staking.connect(user).userStakedBooster(user.address, booster.address)
    const previousTotalStakedBoosterAmount = await staking.connect(user).totalStakedBoosterAmount()
    const previousTotalStakedBoosterValue = await staking.connect(user).totalStakedBoosterValue()
    const previousUserBalance = await booster.connect(user).balanceOf(user.address)
    const previousPoolBalance = await booster.connect(user).balanceOf(staking.address)
    // unstake booster
    await staking.connect(user).unstakeBooster(booster.address, unstakeAmount)
    const userInfo = await staking.connect(user).userInfos(user.address)
    expect(userInfo.stakedBoosterAmount).to.equal(
      previousUserInfo.stakedBoosterAmount.sub(unstakeAmount),
      `${username} staked ${await booster.name()} amount, sequence ${sequence}`,
    )
    expect(userInfo.stakedBoosterValue).to.equal(
      previousUserInfo.stakedBoosterValue.sub(unstakeValue),
      `${username} staked ${await booster.name()} value, sequence ${sequence}`,
    )
    expect(userInfo.lastActionTime.toNumber()).to.equal(
      await latestTimestamp(),
      `${username} lastActionTime, sequence ${sequence}`,
    )
    expect(userInfo.lastActionBlock.toNumber()).to.equal(
      await latestBlockNumber(),
      `${username} lastActionBlock, sequence ${sequence}}`,
    )

    expect(await staking.connect(user).userStakedBooster(user.address, booster.address)).to.equal(
      previousUserStakedBoosterAmount.sub(unstakeAmount),
      `userStakedBooster ${await booster.name()}, sequence ${sequence}}`,
    )

    expect(await staking.connect(user).totalStakedBoosterAmount()).equal(
      previousTotalStakedBoosterAmount.sub(unstakeAmount),
      `total staked booster amount, sequence ${sequence}`,
    )
    expect(await staking.connect(user).totalStakedBoosterValue()).equal(
      previousTotalStakedBoosterValue.sub(unstakeValue),
      `total staked booster value, sequence ${sequence}`,
    )

    expect(await booster.connect(user).balanceOf(user.address)).to.equal(
      previousUserBalance.add(unstakeAmount),
      `${username} balance, sequence ${sequence}`,
    )
    expect(await booster.connect(user).balanceOf(staking.address)).to.equal(
      previousPoolBalance.sub(unstakeAmount),
      `Staking booster balance, sequence ${sequence}`,
    )
  }

  async function assertAddLiquidityWithoutBooster(
    amount: BigNumberish,
    user: SignerWithAddress,
    username: string,
    sequence = 0,
  ) {
    await usdc.connect(bob).approve(staking.address, amount)
    const remoteInfo = await staking.connect(bob).getRemoteInfo()
  }

  // it('staking booster with price changed', async function () {
  //   return
  //   await assertUserStakeBooster(booster1, parseEther('300'), bob, 'bob', 0.1, 0)
  //   await assertUserStakeBooster(booster1, parseEther('200'), bob, 'bob', 0.2, 1)
  //   await assertUserStakeBooster(booster1, parseEther('200'), bob, 'bob', 0.3, 1)
  //   await expect(staking.connect(bob).unstakeBooster(booster1.address, parseEther('2000'))).revertedWith(
  //     'DuetProStaking: insufficient staked booster',
  //   )
  // })
  //
  // it('unsupport booster', async function () {
  //   return
  //   await expect(staking.connect(bob).stakeBooster(booster3.address, parseEther('2000'))).revertedWith(
  //     'DuetProStaking: unsupported booster',
  //   )
  // })
  //
  // it('unstaking booster', async function () {
  //   await assertUserStakeBooster(booster1, parseEther('500'), bob, 'bob', 0.1, 0)
  //   await assertUserUnstakeBooster(booster1, parseEther('200'), bob, 'bob', 0.1, 1)
  // })

  it('add liquidity without booster', async function () {
    const addAmount = BigNumber.from(100 * 1e6)
    const addAmount1e18 = addAmount.mul(1e12)

    // bob add liquidity
    await usdc.connect(bob).approve(staking.address, addAmount)
    await staking.connect(bob).addLiquidity(addAmount, [])
    const bobInfo1 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo1.info.shares).to.equal(addAmount1e18)
    expect(bobInfo1.info.boostedShares).to.equal(0)
    expect(bobInfo1.normalLiquidity).to.equal(addAmount1e18)
    // expect(bobInfo).to.equal(addAmount1e18)

    expect(await staking.totalShares()).to.equal(addAmount1e18)
    expect(await staking.totalBoostedShares()).to.equal(0)

    // bob add liquidity again
    await usdc.connect(bob).approve(staking.address, addAmount)
    await staking.connect(bob).addLiquidity(addAmount, [])
    const bobInfo2 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo2[0].shares).to.equal(addAmount1e18.mul(2))
    expect(bobInfo2[0].boostedShares).to.equal(0)
    expect(bobInfo2.normalLiquidity).to.equal(addAmount1e18.mul(2))
    expect(bobInfo2.info.accAddedLiquidity).to.equal(addAmount1e18.mul(2))
    expect(await staking.totalShares()).to.equal(addAmount1e18.mul(2))
    expect(await staking.totalBoostedShares()).to.equal(0)

    // carol add liquidity
    await usdc.connect(carol).approve(staking.address, addAmount)
    await staking.connect(carol).addLiquidity(addAmount, [])
    const carolInfo = await staking.connect(carol).getUserInfo(carol.address)
    expect(carolInfo[0].shares).to.equal(addAmount1e18)
    expect(carolInfo[0].boostedShares).to.equal(0)
    expect(carolInfo.normalLiquidity).to.equal(addAmount1e18)
    expect(await staking.totalShares()).to.equal(addAmount1e18.mul(3))
    expect(await staking.totalBoostedShares()).to.equal(0)

    // mock pnl added
    await lensPool.addPnl(parseEther('100'))
    logger.info('totalShares', (await staking.totalShares()).toString())
    expect((await staking.getRemoteInfo()).liquidity).to.equal(parseEther('400'))

    // bob staked 2/3 of shares
    const bobInfo3 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo3.normalLiquidity).to.equal(parseEther('400').mul(2).div(3))
    // carol staked 1/3 of shares
    const carolInfo2 = await staking.connect(carol).getUserInfo(carol.address)
    expect(carolInfo2.normalLiquidity).to.equal(parseEther('400').mul(1).div(3))

    await lensPool.addPnl(parseEther('-100'))
    expect((await staking.getRemoteInfo()).liquidity).to.equal(parseEther('300'))

    // bob staked 2/3 of shares
    const bobInfo4 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo4.normalLiquidity).to.equal(parseEther('300').mul(2).div(3))
    // carol staked 1/3 of shares
    const carolInfo4 = await staking.connect(carol).getUserInfo(carol.address)
    expect(carolInfo4.normalLiquidity).to.equal(parseEther('300').mul(1).div(3))
  })
  it('add liquidity with booster', async function () {
    const addAmount = BigNumber.from(100 * 1e6)
    const addAmount1e18 = addAmount.mul(1e12)

    // bob add liquidity
    await usdc.connect(bob).approve(staking.address, addAmount)
    await staking.connect(bob).addLiquidity(addAmount, [])
    const bobInfo1 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo1.info.shares).to.equal(addAmount1e18)
    expect(bobInfo1.info.boostedShares).to.equal(0)
    expect(bobInfo1.normalLiquidity).to.equal(addAmount1e18)

    await assertUserStakeBooster(booster1, parseEther('300'), bob, 'bob', 1, 0)

    expect(await staking.totalBoostedShares()).equal(parseEther('100'))
    expect(await staking.totalShares()).equal(parseEther('100'))
    const bobInfo2 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo2.info.shares).to.equal(parseEther('100'))
    expect(bobInfo2.info.boostedShares).to.equal(parseEther('100'))

    // bob add liquidity again
    await usdc.connect(bob).approve(staking.address, addAmount)
    await staking.connect(bob).addLiquidity(addAmount, [])

    const bobInfo3 = await staking.connect(bob).getUserInfo(bob.address)
    expect(bobInfo3.info.shares).to.equal(parseEther('200'))
    expect(bobInfo3.info.boostedShares).to.equal(parseEther('200'))
    expect(bobInfo3.normalLiquidity).to.equal(0)
    expect(bobInfo3.boostedLiquidity).to.equal(parseEther('200'))
    expect(await staking.totalBoostedShares()).equal(parseEther('200'))
    expect(await staking.totalShares()).equal(parseEther('200'))
    // bob add 200 liquidity again
    await usdc.connect(bob).approve(staking.address, addAmount.mul(2))
    await staking.connect(bob).addLiquidity(addAmount.mul(2), [])

    const bobInfo4 = await staking.connect(bob).getUserInfo(bob.address)
    logger.info('bobInfo4', parseOjWithBigNumber(bobInfo4))
    expect(bobInfo4.info.shares).to.equal(parseEther('400'))
    expect(bobInfo4.info.boostedShares).to.equal(parseEther('300'))
    expect(bobInfo4.normalLiquidity).to.equal(parseEther('100'))
    expect(bobInfo4.boostedLiquidity).to.equal(parseEther('300'))
    expect(await staking.totalBoostedShares()).equal(parseEther('300'))
    expect(await staking.totalShares()).equal(parseEther('400'))

    // bob remove 200 liquidity
    await staking.connect(bob).removeLiquidity(addAmount.mul(2), [])

    const bobInfo5 = await staking.connect(bob).getUserInfo(bob.address)

    expect(bobInfo5.info.shares).to.equal(parseEther('200'))
    expect(bobInfo5.info.boostedShares).to.equal(parseEther('200'))
    expect(bobInfo5.normalLiquidity).to.equal(0)
    expect(bobInfo5.boostedLiquidity).to.equal(parseEther('200'))
    expect(await staking.totalBoostedShares()).equal(parseEther('200'))
    expect(await staking.totalShares()).equal(parseEther('200'))
    // unstake booster to mock booster value less than boosted liquidity
  })
  it('normalizeDecimals', async function () {
    expect(await staking.normalizeDecimals(String(1e6), 6, 18)).to.equal(String(1e18))
    expect(await staking.normalizeDecimals(String(1e18), 18, 6)).to.equal(String(1e6))
    expect(await staking.normalizeDecimals(String(1e18), 18, 18)).to.equal(String(1e18))
    expect(await staking.normalizeDecimals(123456, 6, 4)).to.equal(1234)
    expect(await staking.normalizeDecimals(1234, 4, 6)).to.equal(123400)
  })
})
