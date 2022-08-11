const { ethers, network } = require('hardhat');
const { pick } = require('lodash');
const fs = require('fs');
const BigNumber = require('bignumber.js');
const { stringify } = require('csv-stringify/sync');
const axios = require('axios');
const { Provider: MultiCallProvider, Contract: MultiCallContract, setMulticallAddress } = require('ethers-multicall');

const liquidator = '0xCb5177809b24DE33aFF7589809b1951fFa2269Fd';
const now = new Date();
let logFilePrefix = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${now.getHours()}-${now.getMinutes()}`;
/**
 *
 * @param {() => Promise<{[name: string]: Address;}>} getNamedAccounts
 * @param {DeploymentsExtension} deployments
 * @returns {Promise<void>}
 */
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { getNetworkName } = deployments;
  // if (getNetworkName() !== 'forked') {
  //   console.error('must be forked network');
  //   return;
  // }
  const { proxyAdmin, deployer } = await getNamedAccounts();

  logFilePrefix = `${getNetworkName()}-${logFilePrefix}`;
  const execConfig = { from: deployer, gasLimit: 3000000 };
  await upgradeContract(deployments, {
    ...execConfig,
    from: proxyAdmin,
  });
  await enableDUSDRelatedVaultsLiquidation(deployments, execConfig);
  await swapUserDepositVaults(deployments, execConfig);
  await releaseMintVaults(deployments, execConfig);
  await setDUSDRelatedTokenToZeroOracle(deployments, execConfig);
  await releaseZeroValueVaults(deployments, execConfig);
  await getLiquidatorBalances();
};

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{deploy: *, gasLimit: number}} execConfig
 */
async function upgradeContract(deployments, execConfig) {
  const implAddress = (await deployments.get('AppController_Implementation')).address;
  console.log('Upgrading AppController to: ', implAddress);
  const { execute } = deployments;
  await execute(
    'AppController',
    execConfig,
    'upgradeTo',
    (
      await deployments.get('AppController_Implementation')
    ).address,
  );
  console.log('Upgraded AppController to: ', implAddress);
}

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{deploy: *, gasLimit: number}} execConfig
 */
async function enableDUSDRelatedVaultsLiquidation(deployments, execConfig) {
  const { execute } = deployments;
  const depositVaults = [
    // USDT-BUSD
    '0xbcedb96c87a3FeB4B9314b1F73c7E5f426051a16',
    // USDC-BUSD
    '0x534c727EF1CD043132DF558EdB734Da4BE5b7E66',
    // USDC-USDT
    '0xc76944B36E928FDAf9F481048C770877BCe4cd25',
    // BNB-CAKE
    '0x51e6303fAB90554d4FCCF71d8BcF2246999c9313',
    // DUET-CAKE
    '0xecd30328108Fe62603705A56B5dF6757A2c9902E',
    // DUET-WBNB
    '0x3ff0b76A3db4356662Fdf808ede7C921de820A36',
    // CAKE
    '0x7d2Ae0355f374625EDA6E9CA2F3694bb880e39E1',
    // USDT
    '0xCAb51Fe16891960E1D0d8a3DCdb6c51C460536A7',
    // BUSD
    '0x90703ef182FE722Ea3A38a2f367aba72090aea0B',
    // sBUSD
    '0x1E3174C5757cf5457f8A3A8c3E4a35Ed2d138322',
    // USDC
    '0x7265f5C160142883855613Fb85C55900d7B5bD2e',
    // DUET
    '0x2b19468C5668c40DF22b9F2Bd335cbE6432970dE',
    // ETH
    '0x2197827b693eE46C3907893a6e9685BF36d66308',
  ];

  // enable dusd to liquidate
  const dUSDRelatedVaults = [
    // dWTI
    '0x9D90752b06efD43e1AB5e95c5728f08a53A60dFf',
    // dXAU
    '0xCcC091823CCFe88f60D0505fc9Bb5FaBDCAE726e',
    // dTMC
    '0xab3069E7A658104D9203E640cB446072bC85C002',
    // dWTI-dUSD:
    '0x519B4Cff883696e7bD2Fd21821221e9ea9680A83',
    // dXAU-dUSD
    '0x91f02291a4aD9F99b04c37C626651703600273bd',
    // dTMC-dUSD:
    '0x6ec38848e56570f0192Ec1AEb0D2A30c908Ae6D9',
    // dUSD-BUSD:
    '0xC703Fdad6cA5DF56bd729fef24157e196A4810f8',
    // DUET-dUSD:
    '0x4527Ba20F16F86525b6D174b6314502ca6D5256E',
    // dUSD:
    '0xcc8bBe47c0394AbbCA37fF0fb824eFDC79852377',
    // OPE：
    '0xf0df3198200DBE8051301063644Ab363B3eEE2b9',
  ];
  for (let i = 0; i < dUSDRelatedVaults.length; i++) {
    console.log('enabling dUSD related vaults liquidation', `${i + 1}/${dUSDRelatedVaults.length}`);
    await execute('AppController', execConfig, 'setVaultStates', dUSDRelatedVaults[i], {
      enabled: true,
      enableDeposit: false,
      enableWithdraw: false,
      enableBorrow: false,
      enableRepay: false,
      enableLiquidate: true,
    });
  }
}

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{gasLimit: number, from: *}} execConfig
 */
async function setDUSDRelatedTokenToZeroOracle(deployments, execConfig) {
  const { execute, getOrNull } = deployments;
  const dUSDRelatedTokens = [
    // dUSD
    '0xe04fe47516c4ebd56bc6291b15d46a47535e736b',
    // // [] dWTI-dUSD:
    // '0xf8f890e40a5f8d2455a5d7a007dd2170c1a72dd1',
    // // [] dXAU-dUSD
    // '0xc21534dfc450977500648732f49b9b186bcb1386',
    // //  [] dTMC-dUSD: 0x6ec38848e56570f0192Ec1AEb0D2A30c908Ae6D9 /
    // '0xbdb2fbe2b635ee689e916e490673b0a8b9eb687b',
    // //  [] dUSD-BUSD: 0xC703Fdad6cA5DF56bd729fef24157e196A4810f8 /
    // '0x4124A6dF3989834c6aCbEe502b7603d4030E18eC',
    // //  [] DUET-dUSD: 0x4527Ba20F16F86525b6D174b6314502ca6D5256E /
    // '0x33c8fb945d71746f448579559ea04479a23dff17',
    // [] OPE：0xf0df3198200DBE8051301063644Ab363B3eEE2b9 /
    '0x3ef826a9abf18ae80fa86f636516b8123d072e92',
  ];
  const zeroOracle = await getOrNull('ZeroUSDOracle');
  if (!zeroOracle) {
    throw new Error('Deploy ZeroUSDOracle first');
  }
  const zeroOracleAddress = zeroOracle.address;
  for (let i = 0; i < dUSDRelatedTokens.length; i++) {
    console.log('set dUSD related tokens to zero oracle', `${i + 1}/${dUSDRelatedTokens.length}`);
    // setOracles(address _underlying, address _oracle, uint16 _discount, uint16 _premium)
    await execute('AppController', execConfig, 'setOracles', dUSDRelatedTokens[i], zeroOracleAddress, 0, 10000);
  }
}

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{gasLimit: number, from: *}} execConfig
 */
async function swapUserDepositVaults(deployments, execConfig) {
  const { execute } = deployments;
  const users = [
    '0xd9d3dd56936f90ea4c7677f554dfefd45ef6df0f',
    '0xb58c189fad07daf826542ac9f3a3c3a2c5ac4a75',
    '0x771bc6823bfd287c87837653f908c8064e38bd28',
    '0x5275817b74021e97c980e95ede6bbac0d0d6f3a2',
    '0x5bd8d53af7cd96af62589b06798a8e4216d4d7e8',
    '0xf51e815a8d7f93d5b3420279993f53538fdcebc2',
    '0x192c7e984bf91cd5f30a5378ebced38a6eb46ad8',
    '0x5dfff0ba7b0f0c8431aba53ac1278c3accc8d6c6',
    '0xf82ca9d627b15336de5f88dea0a338cd283188a0',
    '0x14f4f859281e3f941d5194c1938bbab1290e7dcf',
    '0x9c978f74c207d42e88709e269f0c043a5b183b01',
    '0x1b0466be45419bc3af1a1d73eac3c80d7b88b2dc',
    '0x0ad87fd523e19b172109876c1ebb7def23b486c6',
    '0xfc822734399280562d87a6a7268e305861aa89b0',
    '0xc13cad139d0a54bb496cb05be126fcbff785aeae',
    '0xe078b6dfac68b9282c16777a78f2680f1dc5cd86',
    '0xe8d462648329acabcfc4adf2480a9480c14af275',
    '0x11b2e2b4a8f5f7fd59229a1b3d86eb7aaab15f82',
    '0x70edf363c1682b806cd58eaa4c45d7adb6f721f9',
    '0x24f850a2addf409d34f171e56b7e7d74fdac2a0f',
    '0xe4ee208c19807302dec109f797f7390e83fe7c81',
    '0x42810ba75fd56a4052209fc42d5a93174abd66b1',
    '0xaf30e7504eec4e46af6bf4018f8c9f7ce9e9ba8c',
    '0x029734a8b69b30632fa01cb99a0c033401be4be5',
    '0x017935cb9e25b76680a01301d987df3960152236',
    '0xd7f4a04c736cc1c5857231417e6cb8da9cadbec7',
  ];
  const titles = ['user', 'dUSD-BUSD-amount', 'swapped-BUSD-amount', 'DUET-dUSD-amount', 'swapped-DUET-CAKE-amount'];
  const csvRows = [];
  // fs.appendFileSync(`${logFilePrefix}.swapUserDepositVaults.log.csv`, titles.join(','));
  fs.appendFileSync(`${logFilePrefix}.swapUserDepositVaults.log.csv`, '\n');
  for (let i = 0; i < users.length; i++) {
    console.log('swapUserDepositVaults', `${i + 1}/${users.length}`);
    const ret = await execute(
      'AppController',
      execConfig,
      'swapUserDepositVaults',
      users[i],
      liquidator,
      [
        // dUSD-BUSD:
        '0xC703Fdad6cA5DF56bd729fef24157e196A4810f8',
        // DUET-dUSD:
        '0x4527Ba20F16F86525b6D174b6314502ca6D5256E',
      ],
      [
        // BUSD
        '0x90703ef182FE722Ea3A38a2f367aba72090aea0B',
        // DUET-CAKE
        '0xecd30328108Fe62603705A56B5dF6757A2c9902E',
      ],
    );
    const csvRow = {};
    ret.events.forEach((rawEvent) => {
      if (rawEvent.event && rawEvent.event === 'DepositVaultSwapped') {
        //   event DepositVaultSwapped(address indexed user, address sourceVault, uint256 sourceAmount, address targetVault, uint256 targetAmount);
        csvRow.user = rawEvent.args[0];
        if (rawEvent.args[1] === '0xC703Fdad6cA5DF56bd729fef24157e196A4810f8') {
          csvRow['dUSD-BUSD-amount'] = new BigNumber(rawEvent.args[2].toString())
            .div(1e8)
            .div(1e8)
            .div(1e2)
            .toFixed(10);
          csvRow['swapped-BUSD-amount'] = new BigNumber(rawEvent.args[4].toString())
            .div(1e8)
            .div(1e8)
            .div(1e2)
            .toFixed(10);
        }

        if (rawEvent.args[1] === '0x4527Ba20F16F86525b6D174b6314502ca6D5256E') {
          csvRow['DUET-dUSD-amount'] = new BigNumber(rawEvent.args[2].toString())
            .div(1e8)
            .div(1e8)
            .div(1e2)
            .toFixed(10);
          csvRow['swapped-DUET-CAKE-amount'] = new BigNumber(rawEvent.args[4].toString())
            .div(1e8)
            .div(1e8)
            .div(1e2)
            .toFixed(10);
        }
      }
    });
    csvRows.push(csvRow);
    fs.appendFileSync(`${logFilePrefix}.swapUserDepositVaults.log.csv`, titles.map((title) => csvRow[title]).join(','));
    fs.appendFileSync(`${logFilePrefix}.swapUserDepositVaults.log.csv`, '\n');
  }
  // const csvOutput = stringify([titles, ...csvRows.map((csvRow) => titles.map((title) => csvRow[title]))]);
  // fs.writeFileSync(`${logFilePrefix}.swapUserDepositVaults.log.csv`, csvOutput);
}

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{deploy: *, gasLimit: number}} execConfig
 */
async function releaseMintVaults(deployments, execConfig) {
  const { execute } = deployments;
  const borrowers = [
    '0xb58c189fad07daf826542ac9f3a3c3a2c5ac4a75',
    '0xd9d3dd56936f90ea4c7677f554dfefd45ef6df0f',
    '0x771bc6823bfd287c87837653f908c8064e38bd28',
    '0x53dc3204f2f294f6a5649a36ac295f74a0db92e0',
    '0x3a887cf29012fb8ab4ee196a3eaccdaf57946fa8',
    '0x77cae05d7f99ef42c023ddd191fe7690a182797c',
    '0x5bd8d53af7cd96af62589b06798a8e4216d4d7e8',
    '0xfc822734399280562d87a6a7268e305861aa89b0',
    '0x849fd87be38b93e8a16354aa07565f47bff19ab6',
    '0xc2cabab5542b686fc1befd2c6e7128af1dffcca7',
    '0x9c9a0efc16e08070666a6c5518a17652c289f1e0',
    '0xfac2e3d84b2468171abf2c2470425e434fb8a587',
    '0xaf30e7504eec4e46af6bf4018f8c9f7ce9e9ba8c',
    '0xc13cad139d0a54bb496cb05be126fcbff785aeae',
    '0x1bbb923d93d0da3f8bba0ff7ad2ab0d582683046',
    '0xca3ab843b1c0665816b45cee77b3a0c1c3338c98',
    '0xaba85be3b17f1eadd28ad8db3ac61427cf8c7442',
    '0xd98e67b26003fcb922375c30a9b82cac511e3946',
    '0x0e08d482f4b91c8588ad6a980ff5c80bbf6ad03f',
    '0xd67a5cf5a16b1e4b133e47175fef86092e433a6b',
    '0xde78578c768d91ef6f50c0405a880f65351abc31',
    '0x4475d1be974301106036061898b26fd5d62dbf5c',
    '0xa53c541d155c06a6fc0b0d42ea26ad7414cf547b',
    '0x192c7e984bf91cd5f30a5378ebced38a6eb46ad8',
    '0xf0419ee1156cc75fc0dbaa1906f85782430a5f6e',
    '0x5dfff0ba7b0f0c8431aba53ac1278c3accc8d6c6',
    '0xaa8bdb60ee28e7616bfe4867f58bfe4edf858271',
    '0xeb5efb9255e68c44d034d5eaf9d7a49114120879',
    '0x2418c7ff88f10b461566a65d5563c22aba85ab2b',
    '0xad382901be4c94467fefbf32e0764cd977b67344',
    '0x0ff5f33406902b67f3cc11b74ed845f06cc721bf',
    '0xd047b39824107d23116b544e1127fc0d3b131509',
    '0x45aecad3551f5c628e07a2a2b190bce2229fde5a',
    '0xcdbc0f810414fc48aaefc9e959de0af878319cd5',
    '0x42810ba75fd56a4052209fc42d5a93174abd66b1',
    '0x13d0c2951df89bae3c32569fd54eb6a05fe15592',
    '0x78e8c645f80dc536a87aa508aefba05c5316eec2',
    '0xe35e49532b4067d514d76ca769b984e844b1e031',
  ];
  const results = [];
  const csvRows = [];
  const titles = ['user', 'dusdValueToRelease', 'releasedUsdValue'];
  // fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.json`, '[');

  // fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.csv`, titles.join(','));
  for (let i = 0; i < borrowers.length; i++) {
    const borrower = borrowers[i];
    console.log('releaseMintVaults', borrower, `${i + 1}/${borrowers.length}`);
    let result = {
      borrower,
      user: borrower,
    };
    const ret = await execute('AppController', execConfig, 'releaseMintVaults', borrower, liquidator, [
      '0xcc8bBe47c0394AbbCA37fF0fb824eFDC79852377',
    ]);
    result = {
      ...result,
      ...pick(ret, ['transactionHash', 'from', 'to', 'blockNumber', 'confirmations', 'status']),
      events: ret.events.map((rawEvent) => {
        const event = pick(rawEvent, [
          'transactionIndex',
          'blockNumber',
          'topics',
          'data',
          'logIndex',
          'args',
          'event',
          'eventSignature',
        ]);
        if (event.event && event.event.endsWith('VaultReleased')) {
          event.argsObj = {
            user: event.args[0],
            vault: event.args[1],
            amount: new BigNumber(event.args[2].toString()).div(1e8).div(1e8).div(1e2).toFixed(10),
            usdValue: new BigNumber(event.args[3].toString()).div(1e8).toFixed(5),
          };
        }
        if (event.event === 'VaultsReleased') {
          event.argsObj = {
            user: event.args[0],
            expectedUsdValue: new BigNumber(event.args[1].toString()).div(1e8).toFixed(5),
            releasedUsdValue: new BigNumber(event.args[2].toString()).div(1e8).toFixed(5),
          };
          const csvRow = {
            user: event.argsObj.user,
            dusdValueToRelease: event.argsObj.expectedUsdValue,
            releasedUsdValue: event.argsObj.releasedUsdValue,
          };
          csvRows.push(csvRow);
          fs.appendFileSync(
            `${logFilePrefix}.releaseMintVaults.log.csv`,
            titles.map((title) => csvRow[title]).join(','),
          );
          fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.csv`, '\n');
        }
        console.log('event', event);
        return event;
      }),
    };
    results.push(result);
    fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.json`, JSON.stringify(result, null, 2));
    fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.json`, ',\n');

    console.log('released', ret);
  }
  fs.appendFileSync(`${logFilePrefix}.releaseMintVaults.log.json`, ']');

  // fs.writeFileSync(`${logFilePrefix}.releaseMintVaults.log.json`, JSON.stringify(results, null, 2));
  // const csvOutput = stringify([titles, ...csvRows.map((csvRow) => titles.map((title) => csvRow[title]))]);
  // fs.writeFileSync(`${logFilePrefix}.releaseMintVaults.log.csv`, csvOutput);
}

/**
 *
 * @param {DeploymentsExtension} deployments
 * @param {{gasLimit: number, from: *}} execConfig
 */
async function releaseZeroValueVaults(deployments, execConfig) {
  const { execute } = deployments;
  const users = [
    '0xb58c189fad07daf826542ac9f3a3c3a2c5ac4a75',
    '0xd9d3dd56936f90ea4c7677f554dfefd45ef6df0f',
    '0x5df89e500d14fbdc01ca39af9e76e76bc46c7a09',
    '0xa2e2c0ef708ecdeebf7da840f2b38389d19803db',
    '0x14f4f859281e3f941d5194c1938bbab1290e7dcf',
    '0x5275817b74021e97c980e95ede6bbac0d0d6f3a2',
    '0x93f5043925c4d2a28628330820925fe0a82d2b24',
    '0xc13cad139d0a54bb496cb05be126fcbff785aeae',
    '0x3a887cf29012fb8ab4ee196a3eaccdaf57946fa8',
    '0x2d0c7a0807a21615fb945dd64afde7861dfb9c43',
    '0x73234a37e49902136eb5318804f195b78cfdea34',
    '0xd047b39824107d23116b544e1127fc0d3b131509',
    '0x691d6724e2e956457632b5072b2f0ee826ae0b61',
    '0xa98d587471b48518163d3d2268ef4ed42cd69614',
    '0xa4036d9c5d1c5edb323cedc88699e8241a3773bd',
    '0xf43f5be06615a0303c8cff19e38cc1fe0f0ebbc3',
    '0x9c2fa2cddea1c0a612049728d4af9ba20fe58630',
    '0xd161099739c555b6d3d5e565cd55c470ee430f0e',
    '0xd89c07d7abbf83e4bac5907567c8cc1b32491450',
    '0xbdb4cb303a4e288110d57e9b25ad96242b5f1b9d',
    '0xb5ee4f9dfcab6198dee8b013a74c951a44b8d78d',
    '0xf4ce1da492110616024d401f8c659ff395851726',
    '0x4b564101ccf16e94c1e304708650807e06a39bdc',
    '0x771bc6823bfd287c87837653f908c8064e38bd28',
    '0x5bd8d53af7cd96af62589b06798a8e4216d4d7e8',
    '0x7f317b488fd3346a377ef178fde494aa59b044f7',
    '0xf82ca9d627b15336de5f88dea0a338cd283188a0',
    '0xf51e815a8d7f93d5b3420279993f53538fdcebc2',
    '0x192c7e984bf91cd5f30a5378ebced38a6eb46ad8',
    '0x2405189aaf2f3ea50b45c8f3d1fe8bfe12f04004',
    '0x5dfff0ba7b0f0c8431aba53ac1278c3accc8d6c6',
    '0x0ed943ce24baebf257488771759f9bf482c39706',
    '0x55fd2a393793cdb546fe0ab1fdc37df8f61520f4',
    '0x9c978f74c207d42e88709e269f0c043a5b183b01',
    '0x1b0466be45419bc3af1a1d73eac3c80d7b88b2dc',
    '0x0ad87fd523e19b172109876c1ebb7def23b486c6',
    '0xfc822734399280562d87a6a7268e305861aa89b0',
    '0xe078b6dfac68b9282c16777a78f2680f1dc5cd86',
    '0xe8d462648329acabcfc4adf2480a9480c14af275',
    '0x11b2e2b4a8f5f7fd59229a1b3d86eb7aaab15f82',
    '0xc11b02bba83ba5554855ee58f80952b38dafa383',
    '0x70edf363c1682b806cd58eaa4c45d7adb6f721f9',
    '0x24f850a2addf409d34f171e56b7e7d74fdac2a0f',
    '0xe4ee208c19807302dec109f797f7390e83fe7c81',
    '0x42810ba75fd56a4052209fc42d5a93174abd66b1',
    '0xaf30e7504eec4e46af6bf4018f8c9f7ce9e9ba8c',
    '0x029734a8b69b30632fa01cb99a0c033401be4be5',
    '0x017935cb9e25b76680a01301d987df3960152236',
    '0xaa8bdb60ee28e7616bfe4867f58bfe4edf858271',
    '0x4475d1be974301106036061898b26fd5d62dbf5c',
    '0xa53c541d155c06a6fc0b0d42ea26ad7414cf547b',
    '0x77f75363faeaae05aa54aae33e19a0c901147c11',
    '0xf0419ee1156cc75fc0dbaa1906f85782430a5f6e',
    '0x2418c7ff88f10b461566a65d5563c22aba85ab2b',
    '0x7e497d71fc537a0d859211cbef7cca2fa648f8c1',
    '0xec04eaefdd9a514964f136bd3e02398ec62ecc24',
    '0x49c8c7b892f82eedc98551ccb69745005a2fd079',
    '0x3b410f92ccdfad18477c9b4f325cec96d9dd397f',
    '0xe35e49532b4067d514d76ca769b984e844b1e031',
  ];
  const results = [];
  // fs.appendFileSync(`${logFilePrefix}.releaseZeroValueVaults.log.json`, '[');
  for (let i = 0; i < users.length; i++) {
    console.log('releaseZeroValueVaults', users[i], `${i + 1}/${users.length}`);
    const ret = await execute('AppController', execConfig, 'releaseZeroValueVaults', users[i], liquidator);
    let result = {
      user: users[i],
    };
    result = {
      ...result,
      ...pick(ret, ['transactionHash', 'from', 'to', 'blockNumber', 'confirmations', 'status']),
      events: ret.events.map((rawEvent) => {
        const event = pick(rawEvent, [
          'transactionIndex',
          'blockNumber',
          'topics',
          'data',
          'logIndex',
          'args',
          'event',
          'eventSignature',
        ]);
        if (event.event && event.event.endsWith('VaultReleased')) {
          event.argsObj = {
            user: event.args[0],
            vault: event.args[1],
            amount: new BigNumber(event.args[2].toString()).div(1e8).div(1e8).div(1e2).toFixed(10),
            usdValue: new BigNumber(event.args[3].toString()).div(1e8).toFixed(5),
          };
        }
        return event;
      }),
    };
    results.push(result);
    fs.appendFileSync(`${logFilePrefix}.releaseZeroValueVaults.log.json`, JSON.stringify(result, null, 2));
    fs.appendFileSync(`${logFilePrefix}.releaseZeroValueVaults.log.json`, ',\n');
  }
  fs.appendFileSync(`${logFilePrefix}.releaseZeroValueVaults.log.json`, ']');

  // fs.writeFileSync(`${logFilePrefix}.releaseZeroValueVaults.log.json`, JSON.stringify(results, null, 2));
}

const ERC20ABI = [
  'event Approval(address indexed owner, address indexed spender, uint value)',
  'event Transfer(address indexed from, address indexed to, uint value)',
  'function name() external pure returns (string memory)',
  'function symbol() external pure returns (string memory)',
  'function decimals() external pure returns (uint8)',
  'function totalSupply() external view returns (uint)',
  'function balanceOf(address owner) external view returns (uint)',
  'function allowance(address owner, address spender) external view returns (uint)',
  'function approve(address spender, uint value) external returns (bool)',
  'function transfer(address to, uint value) external returns (bool)',
  'function transferFrom(address from, address to, uint value) external returns (bool)',
];

async function getLiquidatorBalances() {
  const ret = await axios.get('https://app.duet.finance/tokens-v0.json');

  console.log('tokens', ret.data);
  const tokens = [];
  for (const token of ret.data) {
    if (!token.address) {
      continue;
    }
    tokens.push({
      symbol: token.symbol,
      address: token.address,
    });
    if (!token.vaults) {
      continue;
    }
    for (const vault of token.vaults) {
      if (!vault.dyTokenAddress) {
        continue;
      }
      tokens.push({
        symbol:
          vault.dyTokenAddress === '0x5F21818aeE05EB7eFC1c59792a224B2A5220efFc'
            ? 'sBUSD'
            : `DY-${token.symbol.replaceAll('-', '_')}`,
        address: vault.dyTokenAddress,
      });
    }
  }
  console.log('tokens', tokens);
  const multiCall = new MultiCallProvider(new ethers.providers.JsonRpcProvider('http://34.226.209.57:8001'));
  setMulticallAddress(8001, '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb');
  await multiCall.init();
  const liquidator = '0xCb5177809b24DE33aFF7589809b1951fFa2269Fd';

  const balancesRet = await multiCall.all(
    tokens.map((token) => {
      const contract = new MultiCallContract(token.address, ERC20ABI);
      return contract.balanceOf(liquidator);
    }),
  );
  const balances = balancesRet.map((rawBalance, index) => {
    return {
      symbol: tokens[index].symbol,
      balance: new BigNumber(rawBalance.toString()).div(1e10).div(1e8).toNumber(),
      tokenAddress: tokens[index].address,
    };
  });
  console.log('balances', balances);
  fs.writeFileSync(`${logFilePrefix}.liquidator-balance.log.csv`, dataToCsv(balances));
}

const dataToCsv = (rows, titles = null) => {
  if (!rows) {
    return '';
  }
  if (!titles) {
    titles = Object.keys(rows[0]);
  }
  return stringify([titles, ...rows.map((csvRow) => titles.map((title) => csvRow[title]))]);
};
