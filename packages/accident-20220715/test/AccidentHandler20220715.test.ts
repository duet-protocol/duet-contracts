import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ethers } from 'hardhat';
import { AccidentHandler20220715, MockERC20 } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

use(chaiAsPromised)

describe('AccidentHandler20220715', function () {
  let minter: SignerWithAddress;
  let handler: AccidentHandler20220715;
  let token: MockERC20;
  let user: SignerWithAddress

  before(async () => {
    [minter, user] = await ethers.getSigners();

    const AccidentHandler20220715 = await ethers.getContractFactory('AccidentHandler20220715');
    handler = await AccidentHandler20220715.connect(minter).deploy();
    await handler.initialize(minter.address)

    const MockERC20 = await ethers.getContractFactory('MockERC20');
    token = await MockERC20.connect(minter).deploy('MockedToken', 'dMT', 10000, 18);
  });


  it('should work as expected', async () => {
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userTokenMap(user.address, token.address)).to.eq(0)
    expect(await token.balanceOf(handler.address)).to.eq(0)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await token.mint(handler.address, 10000)
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userTokenMap(user.address, token.address)).to.eq(0)
    expect(await token.balanceOf(handler.address)).to.eq(10000)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await handler.setRecords([
      { user: user.address, token: token.address, amount: 3000 },
      { user: user.address, token: token.address, amount: 7000 },
    ])
    expect(await handler.remainTokenMap(token.address)).to.eq(10000)
    expect(await handler.userTokenMap(user.address, token.address)).to.eq(10000)
    expect(await token.balanceOf(handler.address)).to.eq(10000)
    expect(await token.balanceOf(user.address)).to.eq(0)

    await handler.connect(user).retrieveTokens([token.address])
    expect(await handler.remainTokenMap(token.address)).to.eq(0)
    expect(await handler.userTokenMap(user.address, token.address)).to.eq(0)
    expect(await token.balanceOf(handler.address)).to.eq(0)
    expect(await token.balanceOf(user.address)).to.eq(10000)
  });


});
