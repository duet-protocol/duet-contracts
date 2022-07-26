import config from '@private/shared/config'

export default {
  ...config,
  address: {
    ...config.address,
    dUSD: {
      bsc: '0xe04fe47516C4Ebd56Bc6291b15D46A47535e736B',
      bsctest: '0x12391C27c090797bd82f25aADa705E53Ba873161',
      hardhat: '0xe04fe47516C4Ebd56Bc6291b15D46A47535e736B',
    },
  }
} as const
