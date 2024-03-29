import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers, network, upgrades } from 'hardhat'
// eslint-disable-next-line camelcase
import { BondFactory, MockERC20, DiscountBond } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'

use(chaiAsPromised)

const MOCK_PRICE = {
  price: parseUnits('0.98', 8),
  bid: parseUnits('0.97', 8),
  ask: parseUnits('0.99', 8),
  lastUpdated: Math.floor(new Date().valueOf() / 1000),
}

describe('Bonds', function () {
  let bondFactory: BondFactory
  let usdcToken: MockERC20
  let discountBond: DiscountBond
  let bondToken: DiscountBond
  let admin: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let carol: SignerWithAddress

  before('Create bond', async () => {
    ;[admin, alice, bob, carol] = await ethers.getSigners()

    const BondFactory = await ethers.getContractFactory('BondFactory')
    bondFactory = (await upgrades.deployProxy(BondFactory, [admin.address], {
      initializer: 'initialize',
    })) as BondFactory
    await bondFactory.deployed()

    const DiscountBond = await ethers.getContractFactory('DiscountBond')
    discountBond = await DiscountBond.connect(admin).deploy()
    await bondFactory.setBondImplementation('Discount', discountBond.address, true)

    const MockERC20 = await ethers.getContractFactory('MockERC20')
    usdcToken = await MockERC20.connect(admin).deploy('MockedToken', 'USDC', parseEther('10000000'), 18)
    // give 2,000,000 usdc to alice
    await usdcToken.connect(admin).transfer(alice.address, parseEther('2000000'))
    // give 2,000,000 usdc to bob
    await usdcToken.connect(admin).transfer(bob.address, parseEther('1000000'))

    const maturityTime = Math.floor(new Date().valueOf() / 1000) + 86400 * 10

    const tx = await bondFactory
      .connect(admin)
      .createBond(
        'Discount',
        'dB26W001',
        'T-Bills@26Weeks#001',
        MOCK_PRICE,
        parseUnits('1000000', 18),
        'USBills',
        usdcToken.address,
        maturityTime,
        'US912796YB94',
      )

    const res = await tx.wait()
    expect(res.events).to.not.eq(undefined, 'After creating Bond, the events should not be empty.')
    if (!res.events) return

    const event = res.events.find((event) => event.event === 'BondCreated')
    expect(event).to.not.eq(undefined, 'After creating Bond, the BondCreated event should not be empty.')
    if (!event || !event.args) return

    const bondTokenAddress = event.args[0]
    expect(bondTokenAddress).to.not.eq(undefined, 'After creating Bond, the bondTokenAddress should not be undefined.')

    bondToken = DiscountBond.attach(bondTokenAddress)
    await usdcToken.connect(alice).approve(bondToken.address, ethers.constants.MaxUint256)
    await usdcToken.connect(bob).approve(bondToken.address, ethers.constants.MaxUint256)

    // bondToken create success
    expect(await bondToken.name()).to.equal('dB26W001', "The bond's name should be set correctly.")
    expect(await bondToken.symbol()).to.equal('T-Bills@26Weeks#001', "The bond's symbol should be set correctly.")
    expect(await bondToken.kind()).to.equal('Discount', "The bond's kind should be set correctly.")
    expect(await bondToken.series()).to.equal('USBills', "The bond's series should be set correctly.")
    expect(await (await bondToken.getPrice()).price).to.equal(
      parseUnits('0.98', 8),
      "The bond's price should be set correctly.",
    )
    expect(await bondToken.isin()).to.equal('US912796YB94', "The bond's isin should be set correctly.")
    expect(await bondToken.inventoryAmount()).to.equal(
      parseEther('1000000'),
      'The bond inventory amount should be set correctly.',
    )
    expect(await bondToken.underlyingToken()).to.equal(
      usdcToken.address,
      "The bond's underlyingToken should be set correctly.",
    )
    expect(+(await bondToken.maturity())).to.equal(maturityTime, "The bond's maturityTime should be set correctly.")

    expect(await bondFactory.isinBondMapping(await bondToken.isin())).to.equal(
      bondToken.address,
      'it should able to get bond address by isin',
    )
  })

  it('admin/keeper should able to get/set price', async () => {
    await bondFactory.connect(admin).setPrice(bondToken.address, MOCK_PRICE.price, MOCK_PRICE.bid, MOCK_PRICE.ask)
    expect((await bondToken.getPrice()).price).to.equal(MOCK_PRICE.price, 'admin should be able to set price')

    await expect(
      bondFactory.connect(carol).setPrice(bondToken.address, MOCK_PRICE.price, MOCK_PRICE.bid, MOCK_PRICE.ask),
    ).to.be.revertedWith('UNAUTHORIZED')

    await bondFactory.setKeeper(carol.address)

    await bondFactory.connect(carol).setPrice(bondToken.address, parseUnits('9.2', 8), MOCK_PRICE.bid, MOCK_PRICE.ask)
    expect((await bondToken.getPrice()).price).to.equal(parseUnits('9.2', 8), 'keeper should be able to set price')
  })

  const shouldBuyBondCorrectly = async (user: SignerWithAddress, buyAmount: BigNumber) => {
    const usdcOfAlice = await usdcToken.balanceOf(user.address)
    const usdcOfBondToken = await usdcToken.balanceOf(bondToken.address)
    const bondTokenOfAlice = await bondToken.balanceOf(user.address)
    const bondTokenOfInventory = await bondToken.inventoryAmount()

    const price = await (await bondToken.getPrice()).ask

    await bondToken.connect(user).mintByUnderlyingAmount(user.address, buyAmount)

    expect(await usdcToken.balanceOf(user.address)).to.equal(
      usdcOfAlice.sub(buyAmount),
      "After buying bond, user's underlying token balance should be correct",
    )
    expect(await usdcToken.balanceOf(bondToken.address)).to.equal(
      usdcOfBondToken.add(buyAmount),
      "After buying bond, The bond contract's underlying token balance should be correct",
    )
    expect(await bondToken.balanceOf(user.address)).to.equal(
      bondTokenOfAlice.add(buyAmount.mul(parseUnits('1', 8)).div(price)),
      "After buying bond, The user's bond token balance should be correct",
    )
    expect(await bondToken.inventoryAmount()).to.equal(
      bondTokenOfInventory.sub(buyAmount.mul(parseUnits('1', 8)).div(price)),
      "After buying bond, The bond token's inventoryAmount should be correct",
    )
  }

  it('user can buy bond under the amount of distribution', async () => shouldBuyBondCorrectly(alice, parseEther('100')))

  it(`user can't buy bond beyond the amount of distribution`, async () => {
    await expect(
      bondToken.connect(alice).mintByUnderlyingAmount(alice.address, parseEther('1200000')),
    ).to.be.revertedWith('DiscountBond: INSUFFICIENT_LIQUIDITY')
  })

  it(`user can buy bond again after grant`, async () => {
    const bondTokenOfInventory = await bondToken.inventoryAmount()

    await bondFactory.connect(admin).grant(bondToken.address, parseEther('1000000'))
    expect(await bondToken.inventoryAmount()).to.equal(
      bondTokenOfInventory.add(parseEther('1000000')),
      'It should be able to grant inventoryAmount',
    )

    await shouldBuyBondCorrectly(alice, parseEther('1200000'))
  })

  it(`user can sell bond`, async () => {
    const sellBondAmount = parseEther('36.23832')

    const usdcOfAlice = await usdcToken.balanceOf(alice.address)
    const usdcOfBondToken = await usdcToken.balanceOf(bondToken.address)
    const bondTokenOfAlice = await bondToken.balanceOf(alice.address)
    const bondTokenOfInventory = await bondToken.inventoryAmount()
    const price = await (await bondToken.getPrice()).bid

    await bondToken.connect(alice).sellByBondAmount(sellBondAmount)

    expect(await usdcToken.balanceOf(alice.address)).to.equal(
      usdcOfAlice.add(sellBondAmount.mul(price).div(parseUnits('1', 8))),
      "After selling bond, user's underlying token balance should be correct",
    )
    expect(await usdcToken.balanceOf(bondToken.address)).to.equal(
      usdcOfBondToken.sub(sellBondAmount.mul(price).div(parseUnits('1', 8))),
      "After selling bond, The bond contract's underlying token balance should be correct",
    )
    expect(await bondToken.balanceOf(alice.address)).to.equal(
      bondTokenOfAlice.sub(sellBondAmount),
      "After selling bond, The user's bond token balance should be correct",
    )
    expect(await bondToken.inventoryAmount()).to.equal(
      bondTokenOfInventory.add(sellBondAmount),
      "After selling bond, The bond token's inventoryAmount should be correct",
    )
  })

  it(`user can't redeem before maturity time`, async () => {
    await expect(bondToken.connect(alice).redeem(parseEther('200.48'))).to.be.revertedWith(
      'DiscountBond: MUST_AFTER_MATURITY',
    )
  })

  it(`user can redeem after maturity time`, async () => {
    const redeemAmount = parseEther('200.48')

    const usdcOfAlice = await usdcToken.balanceOf(alice.address)
    const usdcOfBondToken = await usdcToken.balanceOf(bondToken.address)
    const bondTokenOfAlice = await bondToken.balanceOf(alice.address)
    const bondTokenOfRedeemed = await bondToken.redeemedAmount()

    await network.provider.send('evm_increaseTime', [86400 * 20])
    await network.provider.send('evm_mine')
    await bondToken.connect(alice).redeem(redeemAmount)

    expect(await usdcToken.balanceOf(alice.address)).to.equal(
      usdcOfAlice.add(redeemAmount),
      "After redeeming bond, user's underlying token balance should be correct",
    )
    expect(await usdcToken.balanceOf(bondToken.address)).to.equal(
      usdcOfBondToken.sub(redeemAmount),
      "After redeeming bond, The bond contract's underlying token balance should be correct",
    )
    expect(await bondToken.balanceOf(alice.address)).to.equal(
      bondTokenOfAlice.sub(redeemAmount),
      "After redeeming bond, The user's bond token balance should be correct",
    )
    expect(await bondToken.redeemedAmount()).to.equal(
      bondTokenOfRedeemed.add(redeemAmount),
      "After redeeming bond, The bond token's redeemedAmount should be correct",
    )
  })

  it(`admin withdraw half of the usdc of bond`, async () => {
    const usdcOfBond = await usdcToken.balanceOf(bondToken.address)
    const usdcOfAdmin = await usdcToken.balanceOf(admin.address)

    const withdrawAmount = usdcOfBond.div(2)
    await bondFactory.connect(admin).underlyingOut(bondToken.address, withdrawAmount)
    expect(await usdcToken.balanceOf(admin.address)).to.eq(
      usdcOfAdmin.add(withdrawAmount),
      "After withdraw, the admin's underlying token balance should be correct",
    )
    expect(await usdcToken.balanceOf(bondToken.address)).to.eq(
      usdcOfBond.sub(withdrawAmount),
      "After withdraw, the bond token contract's underlying token balance should be correct",
    )
  })

  it(`should be able to remove bond`, async () => {
    const maturityTime = Math.floor(new Date().valueOf() / 1000) + 86400 * 40

    const tx = await bondFactory.connect(admin).createBond(
      'Discount',
      'dB26W002',
      'T-Bills@26Weeks#002',
      {
        price: parseUnits('0.98', 8),
        bid: parseUnits('0.97', 8),
        ask: parseUnits('0.99', 8),
        lastUpdated: Math.floor(new Date().valueOf() / 1000),
      },
      parseUnits('1000000', 18),
      'USBills',
      usdcToken.address,
      maturityTime,
      'US912828YW42',
    )

    const res = await tx.wait()
    expect(res.events).to.not.eq(undefined)
    if (!res.events) return

    const event = res.events.find((event) => event.event === 'BondCreated')
    expect(event).to.not.eq(undefined)
    if (!event || !event.args) return

    const bondTokenAddress = event.args[0]
    expect(typeof bondTokenAddress).to.not.eq(undefined)

    const DiscountBond = await ethers.getContractFactory('DiscountBond')
    const secondBondToken = DiscountBond.attach(bondTokenAddress)

    expect(+(await bondFactory.getKindBondLength('Discount'))).to.eq(
      2,
      'After creating second bond, the kind length should be correct',
    )

    await bondFactory.connect(admin).removeBond(secondBondToken.address)

    expect(+(await bondFactory.getKindBondLength('Discount'))).to.eq(
      1,
      'After removing, the kind length should be correct',
    )
  })
})
