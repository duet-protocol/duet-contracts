import { artifacts, ethers } from 'hardhat'
import { DuetMathMock } from '../typechain'
const { BN, constants } = require('@openzeppelin/test-helpers')

const { expect } = require('chai')
const { MAX_UINT256 } = constants

describe('Duet math', function () {
  return
  const min = new BN('1234')
  const max = new BN('5678')
  const MAX_UINT256_SUB1 = MAX_UINT256.sub(new BN('1'))
  const MAX_UINT256_SUB2 = MAX_UINT256.sub(new BN('2'))
  let math: DuetMathMock
  const DuetMathMockArtifact = artifacts.readArtifactSync('DuetMathMock')

  beforeEach(async function () {
    const [owner] = await ethers.getSigners()
    const duetMathMeta = require('../artifacts/contracts/libs/DuetMath.sol/DuetMath.json')
    const DuetMathMockContract = await ethers.getContractFactory(
      'DuetMathMock',
      DuetMathMockArtifact.deployedLinkReferences,
    )
    math = await DuetMathMockContract.connect(owner).deploy()
  })

  describe('muldiv', function () {
    describe('does round down', async function () {
      it('small values', async function () {
        expect(await math.mulDiv('3', '4', '5', 0)).to.be.bignumber.equal('2')
        expect(await math.mulDiv('3', '5', '5', 0)).to.be.bignumber.equal('3')
      })
    })

    describe('does round up', async function () {
      it('small values', async function () {
        expect(await math.mulDiv('3', '4', '5', 1)).to.be.bignumber.equal('3')
        expect(await math.mulDiv('3', '5', '5', 1)).to.be.bignumber.equal('3')
      })
    })

    describe('does round down', async function () {
      expect(await math.mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, 0)).to.be.bignumber.equal(new BN('41'))

      expect(await math.mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, 0)).to.be.bignumber.equal(new BN('17'))

      expect(await math.mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, 0)).to.be.bignumber.equal(
        MAX_UINT256_SUB2,
      )

      expect(await math.mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, 0)).to.be.bignumber.equal(MAX_UINT256_SUB1)

      expect(await math.mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, 0)).to.be.bignumber.equal(MAX_UINT256)
    })

    describe('does round up', async function () {
      expect(await math.mulDiv(new BN('42'), MAX_UINT256_SUB1, MAX_UINT256, 1)).to.be.bignumber.equal(new BN('42'))

      expect(await math.mulDiv(new BN('17'), MAX_UINT256, MAX_UINT256, 1)).to.be.bignumber.equal(new BN('17'))

      expect(await math.mulDiv(MAX_UINT256_SUB1, MAX_UINT256_SUB1, MAX_UINT256, 1)).to.be.bignumber.equal(
        MAX_UINT256_SUB1,
      )

      expect(await math.mulDiv(MAX_UINT256, MAX_UINT256_SUB1, MAX_UINT256, 1)).to.be.bignumber.equal(MAX_UINT256_SUB1)

      expect(await math.mulDiv(MAX_UINT256, MAX_UINT256, MAX_UINT256, 1)).to.be.bignumber.equal(MAX_UINT256)
    })
  })
})
