import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import { ExtendableBondRegistry } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { randomUUID } from 'crypto'

use(chaiAsPromised)

describe('ExtendableBondRegistry', function () {
  let minter: SignerWithAddress
  let registry: ExtendableBondRegistry
  let groupA = `A:${randomUUID()}`
  let groupB = `B:${randomUUID()}`
  let uA1: SignerWithAddress, uA2: SignerWithAddress, uB1: SignerWithAddress

  before(async () => {
    ;[minter, uA1, uA2, uB1] = await ethers.getSigners()
    const ExtendableBondRegistryContract = await ethers.getContractFactory('ExtendableBondRegistry')
    registry = await ExtendableBondRegistryContract.connect(minter).deploy()
    await registry.initialize(minter.address)
  })

  it('has no groups at first', async () => {
    expect(await registry.groupNames()).to.deep.eq([])
  })

  it('should able to create groups, and they should be enumerable', async () => {
    await registry.createGroup(groupA)
    expect(await registry.groupNames()).to.deep.eq([groupA])
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([])

    await registry.createGroup(groupB)
    expect(await registry.groupNames()).to.deep.eq([groupA, groupB])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([])
  })

  it('should fail if create duplicate group', async () => {
    await expect(registry.createGroup(groupA)).to.eventually.rejected
  })

  it('should able to append items, and isolated with each group', async () => {
    await registry.appendGroupItem(groupA, uA1.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([uA1.address])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([])

    await registry.appendGroupItem(groupB, uB1.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([uA1.address])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([uB1.address])

    await registry.appendGroupItem(groupA, uA2.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([uA1.address, uA2.address])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([uB1.address])
  })

  it('should fail if append duplicate items', async () => {
    await expect(registry.appendGroupItem(groupB, uB1.address)).to.eventually.rejected
  })

  it('should able to remove items from group', async () => {
    await registry.removeGroupItem(groupA, uA1.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([uA2.address])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([uB1.address])
    await registry.removeGroupItem(groupA, uA2.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([uB1.address])
    await registry.removeGroupItem(groupB, uB1.address)
    expect(await registry.groupedAddresses(groupA)).to.deep.eq([])
    expect(await registry.groupedAddresses(groupB)).to.deep.eq([])
  })

  it('should able to destroy groups', async () => {
    await registry.destroyGroup(groupB)
    expect(await registry.groupNames()).to.deep.eq([groupA])
    await registry.destroyGroup(groupA)
    expect(await registry.groupNames()).to.deep.eq([])
  })
})
