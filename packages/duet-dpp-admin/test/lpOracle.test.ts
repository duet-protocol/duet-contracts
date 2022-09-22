import { ethers, network } from 'hardhat'
import {
  CloneFactory,
  DPPOracle,
  DPPOracleAdmin,
  DppRouter,
  DuetDppController,
  DuetDPPFactory,
  FeeRateModel,
  MockBEP20,
  MockOracle,
  MockAggregatorV3,
  WETH9,
  DuetDppLpOracle,
} from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { expect } from 'chai'
import { latestBlockNumber, setBlockTimestampTo, ZERO_ADDRESS } from './helpers'
import { BigNumber } from 'bignumber.js'
import { useLogger } from '../scripts/utils'
import { random } from 'lodash'
import { main } from 'solidity-docgen/dist/main'

const logger = useLogger(__filename)
describe('LpOracle', () => {
  let maintainer: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    david: SignerWithAddress,
    erin: SignerWithAddress,
    frank: SignerWithAddress

  let duetDPPFactory: DuetDPPFactory
  let dppRouter: DppRouter
  let testOracle: MockOracle
  let testDpp: DPPOracle
  let testDppCtrl: DuetDppController

  let aToken: MockBEP20
  let bToken: MockBEP20
  let aOracle: MockAggregatorV3
  let bOracle: MockAggregatorV3
  let duetOracle: DuetDppLpOracle
  let weth: WETH9

  let startBlockNumber: number

  const deadline = '99999999999999999'

  before(async () => {
    ;[maintainer, bob, carol, david, erin, frank] = await ethers.getSigners()
    const DPPOracle = await ethers.getContractFactory('DPPOracle')
    const DPPOracleAdmin = await ethers.getContractFactory('DPPOracleAdmin')
    const CloneFactory = await ethers.getContractFactory('CloneFactory')
    const DuetDppCtrl = await ethers.getContractFactory('DuetDppController')
    const FeeRateModel = await ethers.getContractFactory('FeeRateModel')
    const DuetFac = await ethers.getContractFactory('DuetDPPFactory')
    const weth9 = await ethers.getContractFactory('WETH9')
    const MockOracle = await ethers.getContractFactory('MockOracle')
    const DppRouter = await ethers.getContractFactory('DppRouter')
    const DuetDppLpOracle = await ethers.getContractFactory('DuetDppLpOracle')

    const MockBEP20 = await ethers.getContractFactory('MockBEP20')
    const MockAggregatorV3 = await ethers.getContractFactory('MockAggregatorV3')

    // create token
    aToken = await MockBEP20.connect(maintainer).deploy('mocked aToken', 'USDC', maintainer.address)
    await aToken.connect(maintainer).mint(maintainer.address, parseEther('10000'))
    await aToken.connect(maintainer).mint(bob.address, parseEther('10000'))
    await aToken.connect(maintainer).mint(carol.address, parseEther('10000'))
    bToken = await MockBEP20.connect(maintainer).deploy('mocked bToken', 'WBNB', maintainer.address)
    await bToken.connect(maintainer).mint(maintainer.address, parseEther('10000'))
    await bToken.connect(maintainer).mint(bob.address, parseEther('10000'))
    await bToken.connect(maintainer).mint(carol.address, parseEther('10000'))
    weth = await weth9.connect(maintainer).deploy()

    // creator oracle
    aOracle = await MockAggregatorV3.connect(maintainer).deploy()
    await aOracle.connect(maintainer).initialize(maintainer.address)
    await aOracle.connect(maintainer).setPrice('23600000000')
    bOracle = await MockAggregatorV3.connect(maintainer).deploy()
    await bOracle.connect(maintainer).initialize(maintainer.address)
    await bOracle.connect(maintainer).setPrice('100000000')

    duetOracle = await DuetDppLpOracle.connect(maintainer).deploy()
    await duetOracle.connect(maintainer).initialize()
    await duetOracle.connect(maintainer).setAvailable(true)
    await duetOracle.connect(maintainer).setAggregator(aToken.address, aOracle.address)
    await duetOracle.connect(maintainer).setAggregator(bToken.address, bOracle.address)

    // create dpp dppAdmin and dppCtrl
    let dpp: DPPOracle = await DPPOracle.connect(maintainer).deploy()
    let dppAdmin: DPPOracleAdmin = await DPPOracleAdmin.connect(maintainer).deploy()
    let cloneFac: CloneFactory = await CloneFactory.connect(maintainer).deploy()
    let dppCtrl: DuetDppController = await DuetDppCtrl.connect(maintainer).deploy()
    let feeRate: FeeRateModel = await FeeRateModel.connect(maintainer).deploy()
    testOracle = await MockOracle.connect(maintainer).deploy()
    await testOracle.connect(maintainer).initialize(maintainer.address)

    dppRouter = await DppRouter.connect(maintainer).deploy(maintainer.address)

    duetDPPFactory = await DuetFac.connect(maintainer).deploy()
    await duetDPPFactory.connect(maintainer).initialize(
      maintainer.address,
      cloneFac.address,
      dpp.address,
      dppAdmin.address,
      dppCtrl.address,
      maintainer.address,
      feeRate.address,
      maintainer.address, //dodoApproveProxy,
      weth.address,
    )

    // create a new dpp pool
    await duetDPPFactory.connect(maintainer).createDPPController(
      maintainer.address,
      aToken.address,
      bToken.address,
      '700000000000000', //lpFeeRate
      '100000000000000', //k
      '239856349999999983992', //i
      testOracle.address, //o
      false,
      false,
    )

    //load dppCtrl and dpp
    let dppCtrlAddress = await duetDPPFactory.userRegistry(maintainer.address, 0)
    testDppCtrl = await DuetDppCtrl.attach(dppCtrlAddress)
    let dppAddress = await testDppCtrl._DPP_ADDRESS_()
    testDpp = await DPPOracle.attach(dppAddress)

    // set router
    await dppRouter.setOneAvailablePool(aToken.address, bToken.address, dppAddress)

    // approve
    const approveAmount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    await aToken.connect(maintainer).approve(dppCtrlAddress, approveAmount)
    await bToken.connect(maintainer).approve(dppCtrlAddress, approveAmount)
    await aToken.connect(bob).approve(dppCtrlAddress, approveAmount)
    await bToken.connect(bob).approve(dppCtrlAddress, approveAmount)

    await aToken.connect(maintainer).approve(dppRouter.address, approveAmount)
    await bToken.connect(maintainer).approve(dppRouter.address, approveAmount)
    await aToken.connect(bob).approve(dppRouter.address, approveAmount)
    await bToken.connect(bob).approve(dppRouter.address, approveAmount)
    await aToken.connect(carol).approve(dppRouter.address, approveAmount)
    await bToken.connect(carol).approve(dppRouter.address, approveAmount)

    startBlockNumber = await latestBlockNumber()
  })

  beforeEach(async () => {
    await setBlockTimestampTo(startBlockNumber)
  })

  it('only admin initialize', async () => {
    await expect(
      testDppCtrl.connect(bob).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline),
    ).revertedWith('Must initialized by admin')

    let outAmounts = await testDppCtrl.recommendQuoteInAmount(parseEther('100'))
    console.log(outAmounts)

    await testDppCtrl.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline)
    expect(String(await testDpp._BASE_RESERVE_())).equal(parseEther('100').toString())
  })
  it('test oracle', async () => {
    let curBal = await testDppCtrl.balanceOf(maintainer.address)
    console.log(curBal)

    let lpOracle = await duetOracle.getPrice(testDppCtrl.address)
    console.log('lp price:', lpOracle)
  })
})
