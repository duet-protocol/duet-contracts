import { promisify } from 'util'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { basename, resolve } from 'path'
import { config } from 'dotenv'
import { glob as rawGlob } from 'glob'

const abi2solidity = require('../libs/abi2solidity')
const glob = promisify(rawGlob)

config()


const projectRoot = resolve(__dirname, '..')
const interfacesRoot = `${projectRoot}/shared/interfaces`
const artifactsDir = 'artifacts'
const contractsDir = 'contracts'

const manifest: Record<string, { excludes: string[] }> = {
  "ebcake": { "excludes": ["interfaces/**", "mocks/**"] },
  "ebcake-ctrl": { "excludes": ["interfaces/**", "mocks/**"] },
}
const banner = `// SPDX-License-Identifier: GPL-3.0\npragma solidity 0.8.9;`


const [
  packageName, // keyof manifest ...
] = process.argv.slice(2)
const options = manifest[packageName]
if (!options) {
  console.error(`\`arg0\` can only be one of:   ${Object.keys(manifest).join(', ')}`)
  process.exit(1)
}

void (async () => {

  const packageHome = `${projectRoot}/packages/${packageName}`
  const interfacesHome = `${interfacesRoot}/${packageName}`
  const collected = new Map<string, { contractName: string, abi: any[] }>()

  for (const filename of await glob(`${packageHome}/${artifactsDir}/${contractsDir}/**`, { nodir: true })) {
    if (!filename.endsWith('.json') || filename.endsWith('.dbg.json')) continue
    const { contractName, abi } = JSON.parse(`${await readFile(filename)}`)
    collected.set(filename, { contractName, abi })
  }
  await Promise.all(options.excludes.map(async dir => {
    for (const filename of await glob(`${packageHome}/${artifactsDir}/${contractsDir}/${dir}`, { nodir: true })) {
      collected.delete(filename)
    }
  }))

  await rm(interfacesHome, { recursive: true, force: true });
  for (const [filename, { contractName, abi }] of collected) {
    const path = resolve(filename, '../..').substring(`${packageHome}/${artifactsDir}/${contractsDir}`.length + 1)
    const dirname = resolve(interfacesHome, path || '.')

    await mkdir(dirname, { recursive: true })
    await writeFile(`${dirname}/I${contractName}.sol`, banner + '\n\n' + abi2solidity(abi, `I${contractName}`))
    console.info(`Wrote interface: ${path ? `${path}/` : ''}I${contractName}.sol`)
  }


})()



