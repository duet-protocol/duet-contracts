import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { BondToken } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('BondToken', function () {
  let minter: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress,
    accounts: SignerWithAddress[];
  let bondToken: BondToken;

  before(async () => {
    [minter, bob, carol, david, erin, frank, ...accounts] = await ethers.getSigners();
    const BondTokenContract = await ethers.getContractFactory('BondToken');
    bondToken = await BondTokenContract.connect(minter).deploy('ebCAKE test', 'ebCAKE-test', minter.address);
  });
  it('amount to mint should be greater than 0', async function () {
    await expect(bondToken.connect(minter).mint(bob.address, parseEther('0').toString())).to.be.revertedWith(
      'Nothing to mint',
    );
  });
  it('only minter can mint', async function () {
    await expect(bondToken.connect(bob).mint(bob.address, parseEther('10').toString())).to.be.revertedWith(
      'Minter only',
    );
  });
  it('amount to burn should be greater than 0', async function () {
    await expect(bondToken.connect(minter).burnFrom(bob.address, parseEther('0').toString())).to.be.revertedWith(
      'Nothing to burn',
    );
  });
  it('burn amount exceeds balance', async function () {
    await expect(bondToken.connect(minter).burnFrom(bob.address, parseEther('10.1').toString())).to.be.revertedWith(
      'ERC20: burn amount exceeds balance',
    );
  });
  it('mint successfully', async function () {
    expect(await bondToken.connect(bob).balanceOf(bob.address)).to.equal(0);
    await bondToken.connect(minter).mint(bob.address, parseEther('10').toString());
    expect(String(await bondToken.connect(bob).balanceOf(bob.address))).to.equal(String(parseEther('10')));
  });
  it("only minter can burn other's tokens", async function () {
    await expect(bondToken.connect(bob).burnFrom(bob.address, parseEther('10').toString())).to.be.revertedWith(
      'Minter only',
    );
  });
  it('burn successfully', async function () {
    expect(String(await bondToken.connect(bob).balanceOf(bob.address))).to.equal(String(parseEther('10')));
    await bondToken.connect(minter).burnFrom(bob.address, parseEther('10').toString());
    expect(await bondToken.connect(bob).balanceOf(bob.address)).to.equal(0);
  });
});
