import { MockMintVaultA__factory } from '../typechain/factories/MockMintVaultA__factory';
import { MockMintVaultB__factory } from '../typechain/factories/MockMintVaultB__factory';
import { MockMintVaultA } from '../typechain/MockMintVaultA';
import { MockMintVaultB } from '../typechain/MockMintVaultB';
import { MintVault__factory } from './../typechain/factories/MintVault__factory';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ethers } from 'hardhat';
import { DTokenSuiteFactory, MockController, MockOracleUSDAggregator, MintVault } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { randomUUID } from 'crypto'

use(chaiAsPromised)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('DTokenSuiteFactory', function () {
  let minter: SignerWithAddress;
  let controller: MockController;
  let aggregator: MockOracleUSDAggregator;
  let VaultFactory: MintVault__factory;
  let vaultImplement: MintVault;
  let MockVaultAFactory: MockMintVaultA__factory;
  let mockVaultA: MockMintVaultA;
  let MockVaultBFactory: MockMintVaultB__factory;
  let mockVaultB: MockMintVaultB;
  let factory: DTokenSuiteFactory;

  const feeConfAddress = '0x117eD755Cd56Cb05D7f0E1124cf9896B310e9127'
  before(async () => {
    [minter] = await ethers.getSigners();

    const MockController = await ethers.getContractFactory('MockController');
    const MockOracleUSDAggregator = await ethers.getContractFactory('MockOracleUSDAggregator');
    VaultFactory = await ethers.getContractFactory('MintVault');
    const DTokenSuiteFactory = await ethers.getContractFactory('DTokenSuiteFactory');
    MockVaultAFactory = await ethers.getContractFactory('MockMintVaultA')
    MockVaultBFactory = await ethers.getContractFactory('MockMintVaultB')

    controller = await MockController.connect(minter).deploy();
    aggregator = await MockOracleUSDAggregator.connect(minter).deploy(minter.address);
    vaultImplement = await VaultFactory.connect(minter).deploy();

    mockVaultA = await MockVaultAFactory.connect(minter).deploy()
    mockVaultB = await MockVaultBFactory.connect(minter).deploy()

    factory = await DTokenSuiteFactory.connect(minter).deploy();
    await factory.initialize(minter.address, controller.address, feeConfAddress, vaultImplement.address)
  });


  it('should work as expected', async () => {
    const tx = await factory.createMintingSuite('Mocked Token', 'dMT', aggregator.address)
    const { events } = await tx.wait()
    const [, vaultAddress, ] = events?.find(x => x.event === 'DTokenCreated')!.args!

    expect(`${await getProxyImplementAddress(vaultAddress)}`.toLocaleLowerCase()).eq(vaultImplement.address.toLocaleLowerCase())
    expect(await VaultFactory.attach(vaultAddress).controller()).eq(controller.address)
    expect(await VaultFactory.attach(await getProxyImplementAddress(vaultAddress)).controller()).eq(ZERO_ADDRESS)


    const newVaultImplement = await VaultFactory.connect(minter).deploy()
    expect(newVaultImplement.address).not.eq(vaultImplement.address)


    await factory.setSharedVaultImplement(newVaultImplement.address)
    expect(`${await getProxyImplementAddress(vaultAddress)}`.toLocaleLowerCase()).eq(newVaultImplement.address.toLocaleLowerCase())
    expect(await VaultFactory.attach(vaultAddress).controller()).eq(controller.address)
    expect(await VaultFactory.attach(await getProxyImplementAddress(vaultAddress)).controller()).eq(ZERO_ADDRESS)


    await factory.setSharedVaultImplement(mockVaultA.address)
    expect(`${await getProxyImplementAddress(vaultAddress)}`.toLocaleLowerCase()).eq(mockVaultA.address.toLocaleLowerCase())
    expect(await MockVaultAFactory.attach(vaultAddress).version()).eq('A')
    expect(await VaultFactory.attach(vaultAddress).controller()).eq(controller.address)
    expect(await VaultFactory.attach(await getProxyImplementAddress(vaultAddress)).controller()).eq(ZERO_ADDRESS)


    await factory.setSharedVaultImplement(mockVaultB.address)
    expect(`${await getProxyImplementAddress(vaultAddress)}`.toLocaleLowerCase()).eq(mockVaultB.address.toLocaleLowerCase())
    expect(await MockVaultAFactory.attach(vaultAddress).version()).eq('B')
    expect(await VaultFactory.attach(vaultAddress).controller()).eq(controller.address)
    expect(await VaultFactory.attach(await getProxyImplementAddress(vaultAddress)).controller()).eq(ZERO_ADDRESS)

  });

});


async function getProxyImplementAddress(contractAddress: string) {
  // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1) see: https://eips.ethereum.org/EIPS/eip-1967
  const proxyImplementSlotKey = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  const proxyImplementSlotValue = await ethers.provider.getStorageAt(contractAddress, proxyImplementSlotKey);
  return `0x${proxyImplementSlotValue.substring(26)}`
}
