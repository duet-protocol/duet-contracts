import * as path from 'path'
import * as fs from 'fs'
import { useLogger } from './utils'
import { uniq } from 'lodash'

const logger = useLogger(__filename)
logger.info('Cleaning unused solc input files...')
const deploymentsPath = path.resolve(__dirname, '../', 'deployments')
for (const network of fs.readdirSync(deploymentsPath)) {
  let solcInputsInUsed: string[] = []
  const dir = path.resolve(deploymentsPath, network)
  logger.info(`Processing dir: ${dir}`)
  if (!fs.existsSync(dir)) {
    logger.warn(`dir '${dir}' not exists`)
    continue
  }
  for (const fileName of fs.readdirSync(dir)) {
    if (!fileName.endsWith('.json')) {
      logger.info('[', network, ']', 'Ignored file/dir:', fileName)
      continue
    }
    const deployment = require(path.resolve(dir, fileName))
    solcInputsInUsed.push(deployment.solcInputHash)
    // path.resolve(__dirname, '../', 'deployments', network)
  }
  solcInputsInUsed = uniq(solcInputsInUsed)
  logger.info(network, 'solcInputsInUsed', solcInputsInUsed.join(','))
  const solcInputsDir = path.resolve(dir, 'solcInputs')
  if (!fs.existsSync(solcInputsDir)) {
    logger.warn(`dir '${solcInputsDir}' not exists`)
    continue
  }
  for (const solcFile of fs.readdirSync(solcInputsDir)) {
    const hash = solcFile.substring(0, solcFile.length - '.json'.length)
    if (!solcInputsInUsed.includes(hash)) {
      const solcFullPath = path.resolve(dir, 'solcInputs', solcFile)
      logger.warn('[', network, ']', 'Removing', solcFile)
      fs.rmSync(solcFullPath)
    }
  }
}
