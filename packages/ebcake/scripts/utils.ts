import * as fs from 'fs';
import { network } from 'hardhat';

const DEPLOYMENTS_PATH = `${__dirname}/../deployments/${network.name}`;

export function writeAddress(address: string, name: string, contractName = name) {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    fs.mkdirSync(DEPLOYMENTS_PATH, {
      recursive: true,
    });
  }

  fs.writeFileSync(
    `${DEPLOYMENTS_PATH}/${name}.json`,
    JSON.stringify(
      {
        address,
        contractName,
      },
      null,
      2,
    ),
  );
  // contract.provider.abi;
}
