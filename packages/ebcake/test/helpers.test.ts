import { calcUsersMinedBlocks } from './helpers'
import { expect } from 'chai'

describe('helpers.ts', () => {
  it('calcUsersMinedBlocks 1, 3, 2, 4', () => {
    expect(calcUsersMinedBlocks(1, 3, 2, 4)).eql({
      user1ExclusiveBlocks: 1,
      user2ExclusiveBlocks: 1,
      intersectionalBlocks: 1,
    })
  })

  it('calcUsersMinedBlocks 1, 5, 3, 7', () => {
    expect(calcUsersMinedBlocks(1, 5, 3, 7)).eql({
      user1ExclusiveBlocks: 2,
      user2ExclusiveBlocks: 2,
      intersectionalBlocks: 2,
    })
  })
  it('calcUsersMinedBlocks 1, 15, 5, 20', () => {
    expect(calcUsersMinedBlocks(1, 15, 5, 20)).eql({
      user1ExclusiveBlocks: 4,
      user2ExclusiveBlocks: 5,
      intersectionalBlocks: 10,
    })
  })

  it('calcUsersMinedBlocks 1, 2, 1, 2', () => {
    expect(calcUsersMinedBlocks(1, 2, 1, 2)).eql({
      user1ExclusiveBlocks: 0,
      user2ExclusiveBlocks: 0,
      intersectionalBlocks: 1,
    })
  })
  it('calcUsersMinedBlocks 1, 1, 2, 2', () => {
    expect(calcUsersMinedBlocks(1, 1, 2, 2)).eql({
      user1ExclusiveBlocks: 0,
      user2ExclusiveBlocks: 0,
      intersectionalBlocks: 0,
    })
  })
  it('calcUsersMinedBlocks 1, 2, 3, 4', () => {
    expect(calcUsersMinedBlocks(1, 2, 3, 4)).eql({
      user1ExclusiveBlocks: 1,
      user2ExclusiveBlocks: 1,
      intersectionalBlocks: 0,
    })
  })

  it('calcUsersMinedBlocks 3, 4, 1, 2', () => {
    expect(calcUsersMinedBlocks(3, 4, 1, 2)).eql({
      user1ExclusiveBlocks: 1,
      user2ExclusiveBlocks: 1,
      intersectionalBlocks: 0,
    })
  })
})
