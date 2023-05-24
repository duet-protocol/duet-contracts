import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MockERC20, SingleBond } from '../typechain'
import { parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import * as helpers from '@nomicfoundation/hardhat-network-helpers'

describe('SingleBond', function () {
  let admin: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress
  let singleBond: SingleBond
  let maturity: number
  let underlying: MockERC20
  beforeEach(async () => {
    ;[admin, alice, bob, carol] = await ethers.getSigners()
    maturity = Math.ceil(new Date().getTime() / 1000) + 10
    underlying = await (
      await ethers.getContractFactory('MockERC20')
    ).deploy('mock token', 'MOCK', parseEther('10000'), 18)
    singleBond = await (
      await ethers.getContractFactory('SingleBond')
    ).deploy('mock bond', 'BOND', underlying.address, maturity, true)
  })

  it('should admin can mint', async () => {
    await underlying.connect(admin).approve(singleBond.address, parseEther('1000'))
    await singleBond.connect(admin).mint(alice.address, parseEther('1000'))
    expect(await singleBond.balanceOf(alice.address)).to.eq(parseEther('1000'))
  })

  it('should non-admin can not mint', async () => {
    await underlying.connect(alice).approve(singleBond.address, parseEther('1000'))
    expect(singleBond.connect(alice).mint(alice.address, parseEther('1000'))).revertedWith(
      'SingleBond: only owner can mint',
    )
  })

  it('matured', async () => {
    await underlying.connect(admin).approve(singleBond.address, parseEther('1000'))
    await singleBond.connect(admin).mint(alice.address, parseEther('1000'))
    expect(await singleBond.balanceOf(alice.address)).to.eq(parseEther('1000'))
    expect(singleBond.connect(alice).redeemAll(alice.address)).revertedWith('SingleBond: MUST_AFTER_MATURITY')
    await helpers.time.increase(100)
    expect(singleBond.connect(alice).mint(alice.address, parseEther('1'))).revertedWith(
      'SingleBond: MUST_BEFORE_MATURITY',
    )
    await singleBond.connect(alice).redeemAll(alice.address)
    expect(await singleBond.balanceOf(alice.address)).to.eq(parseEther('0'))
    expect(await underlying.balanceOf(alice.address)).to.eq(parseEther('1000'))
  })
})
