// @ts-ignore
import { ethers, tenderly } from 'hardhat'

async function main() {
  await tenderly.verify({
    address: '0xaf0a7ae147e9bbdb42670c9d3bdc45d8b431567f',
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
