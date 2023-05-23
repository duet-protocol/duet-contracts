/* eslint-disable no-process-exit */

import * as ethers from 'ethers'
import * as path from 'path'

async function getProxyInfo(network: string, contract: string) {
  // https://1rpc.io/eth
  // https://1rpc.io/bnb
  // https://1rpc.io/matic
  // https://1rpc.io/zkevm
  // https://1rpc.io/avax/c
  // https://1rpc.io/avax/p
  // https://1rpc.io/avax/x
  // https://1rpc.io/arb
  // https://1rpc.io/glmr
  // https://1rpc.io/astr
  // https://1rpc.io/op
  // https://1rpc.io/zksync2-era
  // https://1rpc.io/ftm
  // https://1rpc.io/celo
  // https://1rpc.io/klay
  // https://1rpc.io/starknet
  // https://1rpc.io/alt-testnet
  // https://1rpc.io/near
  // https://1rpc.io/aurora
  // https://1rpc.io/base-goerli
  // https://1rpc.io/one
  // https://1rpc.io/scrt-rpc
  // https://1rpc.io/scrt-lcd
  const proxyAdminSlot = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
  const proxyImplSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
  const provider = new ethers.providers.JsonRpcProvider(`https://1rpc.io/${network}`)
  const adminSlotValue = await provider.getStorageAt(contract, proxyAdminSlot)
  const implSlotValue = await provider.getStorageAt(contract, proxyImplSlot)
  return {
    admin: `0x${adminSlotValue.substring(26).toLowerCase()}`,
    implement: `0x${implSlotValue.substring(26).toLowerCase()}`,
  }
}

if (process.argv[1].endsWith(path.basename(__filename))) {
  const network = process.argv[2]
  const contract = process.argv[3]
  getProxyInfo(network, contract)
    .then((info) => {
      console.log('info', {
        network,
        contract,
        ...info,
      })
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
