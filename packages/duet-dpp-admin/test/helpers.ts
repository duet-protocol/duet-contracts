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

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
