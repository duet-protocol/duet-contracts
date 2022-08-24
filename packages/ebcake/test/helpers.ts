import { Network } from 'hardhat/types/runtime'
import { ethers, network } from 'hardhat'
import { intersection, last, range } from 'lodash'
import { useLogger } from '../scripts/utils'
import { BigNumber as EthersBigNumber } from 'ethers'
import { BigNumber } from 'bignumber.js'
import { expect } from 'chai'

const logger = useLogger(__filename)

export async function mineBlocks(blocks: number, network: Network) {
  if (blocks > 100) {
    throw new Error('too many blocks to mine')
  }

  for (let i = 0; i < blocks; i++) {
    await network.provider.send('evm_mine')
  }
}

export async function latestBlockNumber() {
  return (await ethers.provider.getBlock('latest')).number
}

export function calcUsersMinedBlocks(
  user1StartedAt: number,
  user1EndsAt: number,
  user2StartedAt: number,
  user2EndsAt: number,
) {
  if (user1StartedAt > user1EndsAt || user2StartedAt > user2EndsAt) {
    throw new Error('the block of startedAt should earlier than endsAt')
  }
  let user1ExclusiveBlocks = 0
  let user2ExclusiveBlocks = 0
  let intersectionalBlocks = 0
  const intersectionalBlockNumbers = intersection(
    range(user1StartedAt, user1EndsAt + 1),
    range(user2StartedAt, user2EndsAt + 1),
  )
  if (user2StartedAt > user1EndsAt || user1StartedAt > user2EndsAt || intersectionalBlockNumbers.length <= 1) {
    logger.info({
      user1StartedAt,
      user1EndsAt,
      user2StartedAt,
      user2EndsAt,
    })
    user1ExclusiveBlocks = user1EndsAt - user1StartedAt
    user2ExclusiveBlocks = user2EndsAt - user2StartedAt
  } else {
    intersectionalBlocks = intersectionalBlockNumbers.length - 1
    if (intersectionalBlocks > 0) {
      const intersectionLeft = intersectionalBlockNumbers[0]
      const intersectionRight = last(intersectionalBlockNumbers)!

      user1ExclusiveBlocks += intersectionLeft > user1StartedAt ? range(user1StartedAt, intersectionLeft).length : 0
      user1ExclusiveBlocks += intersectionRight < user1EndsAt ? range(intersectionRight, user1EndsAt).length : 0
      user2ExclusiveBlocks += intersectionLeft > user2StartedAt ? range(user2StartedAt, intersectionLeft).length : 0
      user2ExclusiveBlocks += intersectionRight < user2EndsAt ? range(intersectionRight, user2EndsAt).length : 0
    }
  }

  return {
    user1ExclusiveBlocks,
    user2ExclusiveBlocks,
    intersectionalBlocks,
  }
}

export function expectRewards(input: {
  rewardsPerBlock: EthersBigNumber | BigNumber
  user1StartedAt: number
  user1EndsAt: number
  user1Rewards: EthersBigNumber | BigNumber
  user2StartedAt: number
  user2EndsAt: number
  user2Rewards: EthersBigNumber | BigNumber
  message?: string
}) {
  const { user1StartedAt, user1EndsAt, user2StartedAt, user2EndsAt, message } = input
  const rewardsPerBlock = new BigNumber(input.rewardsPerBlock.toString())
  const user1Rewards = new BigNumber(input.user1Rewards.toString())
  const user2Rewards = new BigNumber(input.user2Rewards.toString())
  const minedBlocks = calcUsersMinedBlocks(user1StartedAt, user1EndsAt, user2StartedAt, user2EndsAt)

  logger.info('minedBlocks', minedBlocks)
  logger.info('rewards', {
    user1Rewards,
    user2Rewards,
  })

  const expectUser1Rewards = rewardsPerBlock
    .multipliedBy(minedBlocks.user1ExclusiveBlocks)
    .plus(rewardsPerBlock.multipliedBy(minedBlocks.intersectionalBlocks).div(2))

  const expectUser2Rewards = rewardsPerBlock
    .multipliedBy(minedBlocks.user2ExclusiveBlocks)
    .plus(rewardsPerBlock.multipliedBy(minedBlocks.intersectionalBlocks).div(2))

  expect(user1Rewards.toString(), `${message}, assert user1's rewards`).equal(expectUser1Rewards.toString())
  expect(user2Rewards.toString(), `${message}, assert user2's rewards`).equal(expectUser2Rewards.toString())
}

export async function setBlockTimestampTo(timestamp: number) {
  const now = (await ethers.provider.getBlock('latest')).timestamp
  const delta = timestamp - now
  if (delta > 0) {
    await network.provider.send('evm_increaseTime', [delta])
    await network.provider.send('evm_mine')
  }
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
