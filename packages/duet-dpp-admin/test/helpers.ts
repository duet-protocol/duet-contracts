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

export async function setBlockTimestampTo(timestamp: number) {
  const now = (await ethers.provider.getBlock('latest')).timestamp
  const delta = timestamp - now
  if (delta > 0) {
    await network.provider.send('evm_increaseTime', [delta])
    await network.provider.send('evm_mine')
  }
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
