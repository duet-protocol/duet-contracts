import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import config from '../config'
// eslint-disable-next-line node/no-unpublished-import
import { useLogger } from '../scripts/utils'
import { HardhatDeployRuntimeEnvironment } from '../types/hardhat-deploy'
import { useNetworkName, advancedDeploy } from './.defines'

// eslint-disable-next-line node/no-missing-import
import * as csv from 'csv/sync'
import * as fs from 'fs'
import * as path from 'path'
import { parseInt } from 'lodash'
import { BigNumber as EthersBigNumber } from 'ethers'
import BigNumber from 'bignumber.js'
import { tokens } from '../scripts/compensasion'

enum Names {
  AccidentHandler20220715V3 = 'AccidentHandler20220715V3',
}

const gasLimit = 3000000
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const logger = useLogger(__filename)
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { deploy, get, read, execute } = deployments

  const networkName = useNetworkName()
  const { deployer } = await getNamedAccounts()

  const endingAt = Math.round(Date.now() / 1000) + 1 * 60 * 60 * 24 * 61

  const ret = await advancedDeploy(
    {
      hre,
      logger,
      proxied: true,
      name: Names.AccidentHandler20220715V3,
    },
    async ({ name }) => {
      return await deploy(name, {
        from: deployer,
        contract: name,
        proxy: {
          execute: {
            init: {
              methodName: 'initialize',
              args: [deployer, endingAt],
            },
          },
        },
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      })
    },
  )
  if (ret.newlyDeployed && ret.numDeployments && ret.numDeployments <= 1) {
    await addRecords(hre)
  }
  await queryRemainTokenMap(hre)
}
export default func

async function addRecords(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { execute } = deployments
  const { deployer } = await getNamedAccounts()
  const rows: Array<{
    Account: string
    // eslint-disable-next-line camelcase
    BUSD_0xe9e7cea3dedca5984780bafc599bd69add087d56: string
    'dWTI-BUSD_0x3ebd1b7a27dcc113639fce3a063d6083ef0ef56d': string
    'dXAU-BUSD_0x95ca57ff396864c25520bc97deaae978daaf73f3': string
    'dTMC-BUSD_0xf048897b35963aaed1a241512d26540c7ec42a60': string
    'dUSD-BUSD-to-BUSD': string
    'dUSD-BUSD-vault-to-BUSD': string
    'DUET-dUSD-to-DUET-CAKE_0xbdf0aa1d1985caa357a6ac6661d838da8691c569': string
    'DUET-dUSD-vault-to-DUET-CAKE': string
  }> = csv.parse(fs.readFileSync(path.join(__dirname, '../data/userCompensation-0810-1909-filtered.csv')), {
    columns: true,
    // cast: true,
  })

  console.log(rows)

  const records: Array<{
    user: string
    token: string
    amount: string
  }> = []

  for (const row of rows) {
    const user = row.Account
    if (parseFloat(row.BUSD_0xe9e7cea3dedca5984780bafc599bd69add087d56) >= 0.1) {
      records.push({
        user,
        token: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
        amount: new BigNumber(row.BUSD_0xe9e7cea3dedca5984780bafc599bd69add087d56).multipliedBy(1e18).toFixed(),
      })
    }
    if (parseFloat(row['dWTI-BUSD_0x3ebd1b7a27dcc113639fce3a063d6083ef0ef56d']) >= 0.1) {
      records.push({
        user,
        token: '0x3ebd1b7a27dcc113639fce3a063d6083ef0ef56d',
        amount: new BigNumber(row['dWTI-BUSD_0x3ebd1b7a27dcc113639fce3a063d6083ef0ef56d']).multipliedBy(1e18).toFixed(),
      })
    }
    if (parseFloat(row['dXAU-BUSD_0x95ca57ff396864c25520bc97deaae978daaf73f3']) >= 0.1) {
      records.push({
        user,
        token: '0x95ca57ff396864c25520bc97deaae978daaf73f3',
        amount: new BigNumber(row['dXAU-BUSD_0x95ca57ff396864c25520bc97deaae978daaf73f3']).multipliedBy(1e18).toFixed(),
      })
    }
    if (parseFloat(row['dTMC-BUSD_0xf048897b35963aaed1a241512d26540c7ec42a60']) >= 0.1) {
      records.push({
        user,
        token: '0xf048897b35963aaed1a241512d26540c7ec42a60',
        amount: new BigNumber(row['dTMC-BUSD_0xf048897b35963aaed1a241512d26540c7ec42a60']).multipliedBy(1e18).toFixed(),
      })
    }
    if (parseFloat(row['DUET-dUSD-to-DUET-CAKE_0xbdf0aa1d1985caa357a6ac6661d838da8691c569']) >= 0.1) {
      records.push({
        user,
        token: '0xbdf0aa1d1985caa357a6ac6661d838da8691c569',
        amount: new BigNumber(row['DUET-dUSD-to-DUET-CAKE_0xbdf0aa1d1985caa357a6ac6661d838da8691c569'])
          .multipliedBy(1e18)
          .toFixed(),
      })
    }
  }

  logger.info('adding records', records.length)
  await execute(
    Names.AccidentHandler20220715V3,
    {
      from: deployer,
      gasLimit: 3000000,
    },
    'setRecords',
    records,
  )
  logger.info('added records', records.length)
}

async function queryRemainTokenMap(hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre as unknown as HardhatDeployRuntimeEnvironment
  const { read } = deployments
  const remainTokenMap: Record<string, string> = {}
  for (const [symbol, address] of Object.entries(tokens)) {
    remainTokenMap[symbol] = (
      (await read(Names.AccidentHandler20220715V3, 'remainTokenMap', address)) as EthersBigNumber
    ).toString()
  }
  console.log('remainTokenMap', remainTokenMap)
}
