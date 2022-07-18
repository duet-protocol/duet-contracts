import { spawn, } from 'child_process'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { basename, resolve } from 'path'
import { copy } from 'fs-extra'
import { createSourceFile, ScriptTarget, ScriptKind, SyntaxKind, ExportDeclaration, NamedExports, SourceFile } from 'typescript'
import { config } from 'dotenv'
import { S3 } from '@aws-sdk/client-s3'
import { createReadStream, existsSync } from 'fs'
import { createHash } from 'crypto'
import { groupBy } from 'lodash'

config()


const projectRoot = resolve(__dirname, '..')
const sdkRoot = `${projectRoot}/generated-sdk`
const chainAliases = ['bsc', 'bsctest']
const buildId = Date.now()


const [
  tagName, // release, dev, ...
] = process.argv.slice(2)
if (!tagName) {
  console.error('tag name is required as `arg0`')
  process.exit(1)
}


void (async () => {

  // [0] clean previously built results
  await rm(sdkRoot, { recursive: true, force: true });


  const exportingStore = new Map<string, { module: string, hash: string }[]>()
  const metaSheet: {
    module: string,
    chain: { id: number, alias: string },
    contract: { class: string, instance: string, address: string },
  }[] = []
  const builtinFiles = new Map<string, string>()


  // [1] scan packages and build many indexes for following steps
  await Promise.all(
    (await readdir(`${projectRoot}/packages`)).map(async (packageName) => {
      if (packageName.startsWith('.') || packageName.startsWith('_')) return
      const packageRoot = `${projectRoot}/packages/${packageName}`

      if (!existsSync(`${packageRoot}/package.json`)) return
      const packageManifest = JSON.parse(`${await readFile(`${packageRoot}/package.json`)}`)
      if (packageManifest?.duet?.sdk !== true) return
      console.info(`Duet SDK definition detected at "${packageRoot}"`)

      for (const chainAlias of chainAliases) {
        const deploymentPath = `${packageRoot}/deployments/${chainAlias}`
        if (!existsSync(deploymentPath)) {
          console.warn(`Deployment record of ${packageName}@${chainAlias} is resolvable, skipped`)
          continue
        }

        const availableItems = await resolveContractNamesOfTypeChainPackage(packageRoot)
        const typeChainPath = `${packageRoot}/typechain`

        for (const name of availableItems) {
          const typeFilename = `${typeChainPath}/${name}.d.ts`
          const factoryFilename = `${typeChainPath}/factories/${name}__factory.ts`
          if (!exportingStore.has(name)) exportingStore.set(name, [])
          exportingStore.get(name)!.push({
            module: packageName,
            hash: (
              await Promise.all([getFileHash(typeFilename), getFileHash(factoryFilename)])
            ).join('+')
          })
        }

        const { chain, contracts } = await ensureDeploymentMetaIndex(deploymentPath)
        for (const contract of contracts) metaSheet.push({ module: packageName, chain, contract })

        builtinFiles.set(`common.d.ts`, `${typeChainPath}/common.d.ts`)

      }

    })
  )



  const sdkHome = `${sdkRoot}/${tagName}`
  const exportablePaths = new Set<string>()

  // [2] copy `typechain` artifacts and re-construct directories
  await Promise.all([
    ...[...exportingStore].map(async ([name, records]) => {

      const map = new Map<string, string>()
      for (const { module, hash } of records) map.set(hash, module)

      await Promise.all([
        ...map.size === 1
          ? [{
            targetPath: `aligned`,
            sourceModuleName: map.values().next().value as string,
          }]
          : records.map(({ module }) => ({
            targetPath: `specified/${module}`,
            sourceModuleName: module,
          }))
      ].map(async ({ targetPath, sourceModuleName }) => {
        exportablePaths.add(targetPath)

        const targetDirname = `${sdkHome}/src/${targetPath}`
        await Promise.all([
          await mkdir(targetDirname, { recursive: true }).then(async () => {
            await copy(`${projectRoot}/packages/${sourceModuleName}/typechain/${name}.d.ts`, `${targetDirname}/${name}.d.ts`)
          }),
          await mkdir(`${targetDirname}/factories`, { recursive: true }).then(async () => {
            await copy(`${projectRoot}/packages/${sourceModuleName}/typechain/factories/${name}__factory.ts`, `${targetDirname}/factories/${name}__factory.ts`)
          }),
        ])

      }))

    }),
  ])



  // [3] write index files with bootstrapped conditional parameters
  await Promise.all([
    ...[...exportablePaths].map(async (targetPath) => {
      const targetDirname = `${sdkHome}/src/${targetPath}`

      await Promise.all([
        ...[...builtinFiles].map(async ([file, sourceFilename]) => {
          await copy(sourceFilename, `${targetDirname}/${file}`)
        })
      ])

      const headers = new Set<string>()
      headers.add(`import type { Provider } from '@ethersproject/providers'`)
      headers.add(`import type { Signer } from 'ethers'`)
      const body: string[] = []

      for (const file of await readdir(targetDirname)) {
        if (!file.endsWith('.d.ts') || builtinFiles.has(file)) continue
        const className = basename(file, '.d.ts')

        headers.add(`export type { ${className} } from './${className}'`)
        headers.add(`export { ${className}__factory } from './factories/${className}__factory'`)

        const groupedMeta = groupBy(metaSheet.filter(x => x.contract.class == className), (x) => x.contract.instance)
        for (const [instanceName, metaList] of Object.entries(groupedMeta)) {
          headers.add(`import { ${className}__factory } from './factories/${className}__factory'`)
          body.push(`export function createContract__${instanceName}(chainId: number, signerOrProvider: Signer | Provider) {`)
          for (const { contract, chain, module } of metaList) {
            body.push(`  // chain: ${chain.alias}; module: ${module}; class: ${contract.class}; instance: ${contract.instance}`)
            body.push(`  if (chainId === ${JSON.stringify(chain.id)}) return ${className}__factory.connect(${JSON.stringify(contract.address)}, signerOrProvider)`)
          }
          body.push(`  return null`)
          body.push(`}`)
        }

      }

      await writeFile(`${targetDirname}/index.ts`, `// Auto generated by ${__filename}
${[...headers].join('\n')}\n
${body.join('\n')}
      `)

    })
  ])




  const modifiersName = `ethers5`

  // [4] write entry files, manifests, and build configuration staff
  await Promise.all([
    writeFile(`${sdkHome}/src/index.ts`, `export * from "./aligned"\n
      export interface DuetContractsManifest {
        module: string
        chain: { id: number, alias: string }
        contract: { class: string, instance: string, address: string }
      }
    `),
    writeFile(`${sdkHome}/manifest.json`, JSON.stringify(metaSheet, null, 4)),
    writeFile(
      `${sdkHome}/tsconfig.json`,
      JSON.stringify(
        {
          compilerOptions: {
            moduleResolution: 'node',
            target: 'ES2021',
            // "module": "ESNext",
            module: 'CommonJS',
            strict: true,
            skipLibCheck: true,
            declaration: true,
            baseUrl: './src',
            outDir: './lib',
          },
        },
        null,
        4,
      ),
    ),
    writeFile(
      `${sdkHome}/package.json`,
      JSON.stringify(
        {
          name: `@duet-protocol/contracts`,
          main: 'lib/index.js',
          // type: 'module',
          license: 'GPL-3.0',
          files: ['manifest.json', 'lib', 'tsconfig.json'],
          peerDependencies: {
            ethers: '^5.5.0',
            '@ethersproject/providers': '^5.5.0',
          },
          version: `0.0.0-${modifiersName}-${tagName}-${buildId}`,
        },
        null,
        4,
      ),
    ),
  ])


  // [5] compile
  await new Promise<void>((res, rej) => {
    spawn(resolve(projectRoot, 'node_modules/.bin/tsc'), { cwd: sdkHome, stdio: 'inherit' }).on(
      'close',
      (code) => {
        if (code) rej(new Error(`Failed by "${code}"`));
        else res();
      },
    );
  });

  // [6] patch missing staffs while compiling
  await Promise.all([
    ...[...exportablePaths].map(async (targetPath) => {
      const sourceDirname = `${sdkHome}/src/${targetPath}`
      const targetDirname = `${sdkHome}/lib/${targetPath}`
      await Promise.all([
        (await Promise.all([
          readdir(`${sourceDirname}`)
            .then((items) => items.filter(x => !x.startsWith('.') && x.endsWith('.d.ts'))),
          readdir(`${sourceDirname}/factories`)
            .then((items) => items.filter(x => !x.startsWith('.') && x.endsWith('.d.ts')).map((x) => `factories/${x}`)),
        ])).flat(1).map(x => copy(`${sourceDirname}/${x}`, `${targetDirname}/${x}`))
      ])
    })
  ])


  // [7] make pack and ship
  await new Promise<void>((res, rej) => {
    spawn('tar', ['-czf', `../package.tar.gz`, '.'], { cwd: sdkHome, stdio: 'inherit' }).on(
      'close',
      (code) => {
        if (code) rej(new Error(`Failed by "${code}"`));
        else res();
      },
    );
  });
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION } = process.env;
  const moduleKey = `contracts-${modifiersName}/${tagName}-${buildId}.tar.gz`
  await new S3({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } as any).putObject({
    Bucket: AWS_S3_BUCKET,
    Key: moduleKey,
    Body: createReadStream(`${sdkRoot}/package.tar.gz`),
    ContentType: `application/tar+gzip`,
  });
  console.info('Uploaded to S3: ', `https://${AWS_S3_BUCKET}.s3.amazonaws.com/${moduleKey}`);


})()











/**
 * should be replaced by deploy-stage-generated meta index
 */
async function ensureDeploymentMetaIndex(deploymentPath: string) {
  const chainId = parseInt((await readFile(`${deploymentPath}/.chainId`)).toString(), 10)
  if (isNaN(chainId) && chainId <= 0) throw new Error(`Invalid chain id of ${deploymentPath}`)
  const chainAlias = basename(deploymentPath)

  const contracts: { class: string, instance: string, address: string }[] = []
  for (const name of await readdir(`${deploymentPath}/.extraMeta`)) {
    if (name.startsWith('.') || !name.endsWith('.json')) continue
    const base = JSON.parse((await readFile(`${deploymentPath}/.extraMeta/${name}`)).toString())
    const { address } = JSON.parse((await readFile(`${deploymentPath}/${name}`)).toString())
    contracts.push({ ...base, address })
  }

  return { chain: { id: chainId, alias: chainAlias }, contracts }
}


function* loadExportableContractNames(sourceFile: SourceFile) {
  for (const statement of sourceFile.statements) {
    if (statement.kind === SyntaxKind.ExportDeclaration) {
      const exporting = statement as ExportDeclaration
      if (exporting.exportClause?.kind === SyntaxKind.NamedExports) {
        const namedExporting = exporting.exportClause as NamedExports
        for (const { name: { escapedText } } of namedExporting.elements) {
          yield escapedText as string
        }
      }
    }
  }
}


async function resolveContractNamesOfTypeChainPackage(packageRoot: string) {
  const typeChainPath = `${packageRoot}/typechain`
  const typeChainIndex = `${typeChainPath}/index.ts`;
  const sourceFile = createSourceFile(
    typeChainIndex,
    (await readFile(typeChainIndex)).toString(),
    ScriptTarget.Latest,
    false,
    ScriptKind.TS,
  );
  return new Set([...loadExportableContractNames(sourceFile)].filter((x) => !x.endsWith('__factory')));
}


async function getFileHash(filename: string) {
  return createHash('sha256')
    .update(await readFile(filename))
    .digest('hex')
}
