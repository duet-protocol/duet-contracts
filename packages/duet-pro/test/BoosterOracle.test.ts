import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { BoosterOracle } from '../typechain'
import { useLogger } from '@private/shared/scripts/utils'

const USDC_ADDRESS = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'
const DUET_ADDRESS = '0x4d13a9b2E1C6784c6290350d34645DDc7e765808'

describe('Booster Oracle', function () {
  let boosterOracle: BoosterOracle

  beforeEach(async () => {
    const [admin] = await ethers.getSigners()

    boosterOracle = await (await ethers.getContractFactory('BoosterOracle')).connect(admin).deploy()

    const price = await boosterOracle.getPrice(DUET_ADDRESS)

    console.log('price', price)
  })

  it('price of duet', async function () {
    // pass
  })
})
