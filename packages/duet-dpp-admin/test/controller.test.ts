import { ethers, network, upgrades } from 'hardhat'
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
  WETH9,
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
describe('DppCtrl and DppFactory', () => {
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
  let cToken: MockBEP20
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

    const MockBEP20 = await ethers.getContractFactory('MockBEP20')

    aToken = await MockBEP20.connect(maintainer).deploy('mocked aToken', 'USDC', maintainer.address)
    await aToken.connect(maintainer).mint(maintainer.address, parseEther('10000'))
    await aToken.connect(maintainer).mint(bob.address, parseEther('10000'))
    await aToken.connect(maintainer).mint(carol.address, parseEther('10000'))
    bToken = await MockBEP20.connect(maintainer).deploy('mocked bToken', 'WBNB', maintainer.address)
    await bToken.connect(maintainer).mint(maintainer.address, parseEther('10000'))
    await bToken.connect(maintainer).mint(bob.address, parseEther('10000'))
    await bToken.connect(maintainer).mint(carol.address, parseEther('10000'))
    cToken = await MockBEP20.connect(maintainer).deploy('mocked cToken', 'CCC', maintainer.address)
    await cToken.connect(maintainer).mint(maintainer.address, parseEther('10000'))
    weth = await weth9.connect(maintainer).deploy()

    let dpp: DPPOracle = await DPPOracle.connect(maintainer).deploy()
    let dppAdmin: DPPOracleAdmin = await DPPOracleAdmin.connect(maintainer).deploy()
    let cloneFac: CloneFactory = await CloneFactory.connect(maintainer).deploy()
    let dppCtrl: DuetDppController = await DuetDppCtrl.connect(maintainer).deploy()
    let feeRate: FeeRateModel = await FeeRateModel.connect(maintainer).deploy()
    testOracle = await MockOracle.connect(maintainer).deploy()
    await testOracle.connect(maintainer).initialize(maintainer.address)
    await testOracle.connect(maintainer).setPrice(aToken.address, '239856349999999983992')

    dppRouter = await DppRouter.connect(maintainer).deploy(maintainer.address)

    duetDPPFactory = (await upgrades.deployProxy(
      DuetFac,
      [
        maintainer.address,
        cloneFac.address,
        dpp.address,
        dppAdmin.address,
        dppCtrl.address,
        maintainer.address,
        feeRate.address,
        maintainer.address, //dodoApproveProxy,
        weth.address,
      ],
      { unsafeAllow: ['constructor'], constructorArgs: [] },
    )) as DuetDPPFactory

    /*
    await DuetFac.connect(maintainer).deploy()
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
    */

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
      true,
    )

    //load dppCtrl and dpp
    let dppCtrlAddress = await duetDPPFactory.getDppController(aToken.address, bToken.address)
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

    await testDppCtrl.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline)
    expect(String(await testDpp._BASE_RESERVE_())).equal(parseEther('100').toString())
  })

  it.only('test oracle protection', async () => {
    const MockOracle = await ethers.getContractFactory('MockOracle')
    let testOracleZero = await MockOracle.connect(maintainer).deploy()
    await testOracleZero.connect(maintainer).initialize(maintainer.address)

    await expect(
      duetDPPFactory.connect(maintainer).createDPPController(
        maintainer.address,
        aToken.address,
        cToken.address,
        '700000000000000', //lpFeeRate
        '100000000000000', //k
        '239856349999999983992', //i
        testOracleZero.address, //o
        false,
        true,
      ),
    ).revertedWith('Duet Dpp Factory: set invalid oracle')

    await testOracleZero.connect(maintainer).setPrice(aToken.address, '239856349999999983992')

    await duetDPPFactory.connect(maintainer).createDPPController(
      maintainer.address,
      aToken.address,
      cToken.address,
      '700000000000000', //lpFeeRate
      '100000000000000', //k
      '239856349999999983992', //i
      testOracleZero.address, //o
      false,
      false,
    )

    let dppCtrlAddress = await duetDPPFactory.getDppController(aToken.address, bToken.address)
    const DuetDppCtrl = await ethers.getContractFactory('DuetDppController')
    let testCtrl2 = await DuetDppCtrl.attach(dppCtrlAddress)

    //approve
    const approveAmount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    await aToken.connect(maintainer).approve(dppCtrlAddress, approveAmount)
    await cToken.connect(maintainer).approve(dppCtrlAddress, approveAmount)

    // disable oracle liquidity check
    await expect(
      testCtrl2.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline),
    ).revertedWith('Duet Dpp Controller: oracle dpp disabled')

    await testCtrl2.connect(maintainer).enableOracle()
    await testOracleZero.connect(maintainer).setPrice(aToken.address, '0')

    await expect(
      testCtrl2.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline),
    ).revertedWith('Duet Dpp Controller: invalid oracle price')

    await testOracleZero.connect(maintainer).setPrice(aToken.address, '239856349999999983992')
    testCtrl2.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline)
    let macToken = await testCtrl2.balanceOf(maintainer.address)
    logger.log('oracle test mint:', macToken)
  })
  /*
  it('test ratio', async () => {
    await testDppCtrl.connect(maintainer).addDuetDppLiquidity(parseEther('1900'), parseEther('1900'), 0, 0, 0, deadline)

    await testDppCtrl.connect(bob).addDuetDppLiquidity('1900', '1900', 0, 0, 0, deadline)
    let bHoldTokens = await testDppCtrl.balanceOf(bob.address)
    logger.log('check ratio:', bHoldTokens)
  })
  */

  it('deposit and remove', async () => {
    await testDppCtrl.connect(maintainer).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline)

    //deposit(user)
    await testDppCtrl.connect(bob).addDuetDppLiquidity(parseEther('100'), parseEther('100'), 0, 0, 0, deadline)
    expect(String(await testDpp._BASE_RESERVE_())).equal(parseEther('300')) // check dpp pool state
    let mHoldTokens = await testDppCtrl.balanceOf(maintainer.address)
    let bHoldTokens = await testDppCtrl.balanceOf(bob.address)
    logger.log('check dppCtrl tokens:', mHoldTokens, bHoldTokens) // checkTokens

    // test recommend
    let recBase = await testDppCtrl.recommendBaseInAmount(parseEther('50'))
    let recQuote = await testDppCtrl.recommendQuoteInAmount(parseEther('100'))
    logger.log('recBase:', formatEther(recBase[0]), 'recQuote:', formatEther(recQuote[1]))

    // deposit unbalance(user)
    let beforeA = await aToken.balanceOf(bob.address)
    await testDppCtrl.connect(bob).addDuetDppLiquidity(parseEther('100'), recQuote[1], 0, 0, 0, deadline)
    let afterA = await aToken.balanceOf(bob.address)
    logger.log('check deposit unbalance:', formatEther(beforeA), formatEther(afterA))
    recBase = await testDppCtrl.recommendBaseInAmount(parseEther('50'))

    // swap, sell base
    await dppRouter
      .connect(carol)
      .swapExactTokensForTokens(
        parseEther('10'),
        parseEther('0'),
        [aToken.address, bToken.address],
        carol.address,
        deadline,
      )

    // test deposit slippage
    let baseMinAmountIn = new BigNumber(recBase[0].toString()).times(0.99).toFixed(0)
    let quoteMinAmountIn = new BigNumber(recBase[1].toString()).times(0.99).toFixed(0)
    await expect(
      testDppCtrl
        .connect(bob)
        .addDuetDppLiquidity(recBase[0], recBase[1], baseMinAmountIn, quoteMinAmountIn, 0, deadline),
    ).revertedWith('Duet Dpp Controller: deposit amount is not enough')
    logger.log('base In:', recBase[0].toString())

    // withdraw after one swap(user)
    let beforeWithdrawBob = await aToken.balanceOf(bob.address)
    await testDppCtrl.connect(bob).removeDuetDppLiquidity(bHoldTokens, parseEther('0'), parseEther('0'), 0, deadline)
    let AfterWithdrawBob = await aToken.balanceOf(bob.address)
    logger.log('check withdraw:', formatEther(beforeWithdrawBob), formatEther(AfterWithdrawBob))
    let AfterCtrlBob = await testDppCtrl.balanceOf(bob.address)
    let outAmounts = await testDppCtrl.recommendBaseAndQuote(AfterCtrlBob)

    // swap, sell quote
    await dppRouter
      .connect(carol)
      .swapExactTokensForTokens(
        parseEther('100'),
        parseEther('0'),
        [bToken.address, aToken.address],
        carol.address,
        deadline,
      )

    // test remove slippage
    let baseMinAmount = new BigNumber(outAmounts[0].toString()).times(0.99).toFixed(0)
    let quoteMinAmount = new BigNumber(outAmounts[1].toString()).times(0.99).toFixed(0)
    await expect(
      testDppCtrl
        .connect(bob)
        .removeDuetDppLiquidity(
          AfterCtrlBob,
          parseEther(baseMinAmount.toString()),
          parseEther(quoteMinAmount.toString()),
          0,
          deadline,
        ),
    ).revertedWith('Duet Dpp Controller: WITHDRAW_NOT_ENOUGH')
    logger.log('base out:', outAmounts[0].toString())

    // withdraw after two swap(user)
    await testDppCtrl.connect(bob).removeDuetDppLiquidity(AfterCtrlBob, parseEther('0'), parseEther('0'), 0, deadline)
    let AfterWithdrawBob2 = await aToken.balanceOf(bob.address)
    logger.log('check withdraw 2:', formatEther(AfterWithdrawBob2), formatEther(AfterWithdrawBob))
    let AfterCtrlBob2 = await testDppCtrl.balanceOf(bob.address)
    logger.log('check withdraw 2 crtl:', formatEther(AfterCtrlBob2))
  })

  it('cal out and recIn', async () => {
    let outRes = await testDppCtrl.recommendBaseAndQuote(parseEther('1'))
    //let calOut = await testDppCtrl.calBaseAndQuoteOut(parseEther('1'))
    //logger.log('the same:', outRes, calOut)

    let beforeCtrlBob = await testDppCtrl.balanceOf(bob.address)
    await testDppCtrl.connect(bob).addDuetDppLiquidity(outRes[0], outRes[1], 0, 0, 0, deadline)
    let afterCtrlBob = await testDppCtrl.balanceOf(bob.address)
    logger.log('check out ctrl right:', Number(formatEther(afterCtrlBob)) - Number(formatEther(beforeCtrlBob)))
  })

  it('change oracle', async () => {
    let res = await testDpp.querySellBase(bob.address, parseEther('10'))
    let beforeOracleRes = res[0]

    await testOracle.connect(maintainer).setPrice(aToken.address, '0')
    // test enableOracle
    await expect(testDppCtrl.connect(maintainer).enableOracle()).revertedWith(
      'Duet Dpp Controller: invalid oracle price',
    )

    await testOracle.connect(maintainer).setPrice(aToken.address, '3758563499999999839')
    await testDppCtrl.connect(maintainer).enableOracle()

    res = await testDpp.querySellBase(bob.address, parseEther('10'))
    let afterOracleRes = res[0]

    logger.log('check oracle price:', formatEther(beforeOracleRes), formatEther(afterOracleRes))

    await testOracle.connect(maintainer).setPrice(aToken.address, '0')
    // test zero oracle
    await expect(testDppCtrl.connect(maintainer).changeOracle(testOracle.address)).revertedWith(
      'Duet Dpp Controller: invalid oracle price',
    )
    // test invalid oracle
    await expect(testDppCtrl.connect(maintainer).changeOracle(testDpp.address)).to.be.revertedWith('')

    // test disableOracle newI
    await expect(testDppCtrl.connect(maintainer).disableOracle('0')).revertedWith('Duet Dpp Controller: invalid new I')

    await testDppCtrl.connect(maintainer).disableOracle('239856349999999983992')
    res = await testDpp.querySellBase(bob.address, parseEther('10'))
    expect(String(res[0])).equal(String(beforeOracleRes), 'wrong price')
  })
})
