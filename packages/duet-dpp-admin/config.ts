export default {
  address: {
    defaultMtFeeRateModel: {
      bsc: '0x18DFdE99F578A0735410797e949E8D3e2AFCB9D2',
      // mockFeerateModel
      bsctest: '0x0aFDEDe9F2a9E3f79f2aa1B5F55c567AD5d3A211',
      hardhat: null,
    },
    dodoApproveProxy: {
      bsc: '0xB76de21f04F677f07D9881174a1D8E624276314C',
      // mock approve
      bsctest: '0x0aFDEDe9F2a9E3f79f2aa1B5F55c567AD5d3A211',
      hardhat: null,
    },
    weth: {
      bsc: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      bsctest: '0xA314A75563cCE9AeF91d132C72737aCf301E0735',
      hardhat: null,
    },
    usd: {
      bsc: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      bsctest: '0x0b7b53a3c0e8620a170f7228685ad4686f440406',
      hardhat: null,
    },
  },
} as const
