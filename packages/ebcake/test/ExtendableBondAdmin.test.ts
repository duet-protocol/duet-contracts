import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ethers } from 'hardhat';
import { ExtendableBondAdmin } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { randomUUID } from 'crypto'

use(chaiAsPromised)

describe('ExtendableBondAdmin', function () {
  let minter: SignerWithAddress;
  let admin: ExtendableBondAdmin;
  let groupA = `A:${randomUUID()}`
  let groupB = `B:${randomUUID()}`
  let uA1: SignerWithAddress, uA2: SignerWithAddress, uB1: SignerWithAddress

  before(async () => {
    [minter, uA1, uA2, uB1] = await ethers.getSigners();
    const ExtendableBondAdminContract = await ethers.getContractFactory('ExtendableBondAdmin');
    admin = await ExtendableBondAdminContract.connect(minter).deploy(minter.address);
  });

  it('has no groups at first', async () => {
    expect(await admin.groupNames()).to.deep.eq([])
  });

  it('should able to create groups, and they should be enumerable', async () => {
    await admin.createGroup(groupA)
    expect(await admin.groupNames()).to.deep.eq([groupA])
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([])

    await admin.createGroup(groupB)
    expect(await admin.groupNames()).to.deep.eq([groupA, groupB])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([])
  })

  it('should fail if create duplicate group', async () => {
    await expect(admin.createGroup(groupA)).to.eventually.rejected
  })

  it('should able to append items, and isolated with each group', async () => {
    await admin.appendGroupItem(groupA, uA1.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([uA1.address])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([])

    await admin.appendGroupItem(groupB, uB1.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([uA1.address])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([uB1.address])

    await admin.appendGroupItem(groupA, uA2.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([uA1.address, uA2.address])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([uB1.address])
  })

  it('should fail if append duplicate items', async () => {
    await expect(admin.appendGroupItem(groupB, uB1.address)).to.eventually.rejected
  })

  it('should able to remove items from group', async () => {
    await admin.removeGroupItem(groupA, uA1.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([uA2.address])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([uB1.address])
    await admin.removeGroupItem(groupA, uA2.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([uB1.address])
    await admin.removeGroupItem(groupB, uB1.address)
    expect(await admin.groupedAddresses(groupA)).to.deep.eq([])
    expect(await admin.groupedAddresses(groupB)).to.deep.eq([])
  })

  it('should able to destroy groups', async () => {
    await admin.destroyGroup(groupB)
    expect(await admin.groupNames()).to.deep.eq([groupA])
    await admin.destroyGroup(groupA)
    expect(await admin.groupNames()).to.deep.eq([])
  })


});
