import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import { AccidentHandler20220715V3, MockERC20 } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'

use(chaiAsPromised)

describe('AccidentHandler20220715', function () {
  let minter: SignerWithAddress
  let handler: AccidentHandler20220715V3
  let token: MockERC20
  let user: SignerWithAddress
  let timestamp: number

  before(async () => {
    ;[minter, user] = await ethers.getSigners()
    timestamp = Math.round(Date.now() / 1000)

    const AccidentHandler20220715V3 = await ethers.getContractFactory('AccidentHandler20220715V3')
    handler = await AccidentHandler20220715V3.connect(minter).deploy()

    await handler.initialize(minter.address, timestamp + 5 * 60)

    const MockERC20 = await ethers.getContractFactory('MockERC20')
    token = await MockERC20.connect(minter).deploy('MockedToken', 'dMT', 10000, 18)
  })

  it('should able to get/set ending time', async () => {
    expect(await handler.endingAt()).to.eq(timestamp + 5 * 60)
    await handler.setEndingAt(timestamp + 10 * 60)
    expect(await handler.endingAt()).to.eq(timestamp + 10 * 60)
  })

  it('should work with correct balance liquidation', async () => {
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userRetrievableTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.userRetrievedTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.connect(user).retrievables([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await handler.connect(user).retrieved([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await token.balanceOf(handler.address)).to.eq(0)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await token.mint(handler.address, 10000)
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userRetrievableTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.userRetrievedTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.connect(user).retrievables([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await handler.connect(user).retrieved([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await token.balanceOf(handler.address)).to.eq(10000)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await handler.setRecords([
      { user: user.address, token: token.address, amount: 3000 },
      { user: user.address, token: token.address, amount: 7000 },
    ])
    expect(await handler.remainTokenMap(token.address)).to.eq(10000)
    expect(await handler.userRetrievableTokenMap(user.address, token.address)).to.eq(10000)
    expect(await handler.userRetrievedTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.connect(user).retrievables([token.address])).to.deep.eq([BigNumber.from(10000)])
    expect(await handler.connect(user).retrieved([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await token.balanceOf(handler.address)).to.eq(10000)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await handler.connect(user).retrieveTokens([token.address])
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userRetrievableTokenMap(user.address, token.address)).to.eq(0)
    expect(await handler.userRetrievedTokenMap(user.address, token.address)).to.eq(10000)
    expect(await handler.connect(user).retrievables([token.address])).to.deep.eq([BigNumber.from(0)])
    expect(await handler.connect(user).retrieved([token.address])).to.deep.eq([BigNumber.from(10000)])
    expect(await token.balanceOf(handler.address)).to.eq(0)
    expect(await token.balanceOf(user.address)).to.eq(10000)
  })
})
