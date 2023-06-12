// @ts-ignore
import { ethers, tenderly } from 'hardhat'

async function main() {
  await tenderly.verify({
    address: require('../deployments/arbitrum/DuetProStaking_Implementation.json').address,
    name: 'DuetProStaking',
  })
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
