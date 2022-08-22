export default {
  address: {
    DuetAppController: {
      bsc: '0x01d77e7CC19cc562adB17AD6Cb1F08f7a66fe301',
      bsctest: '0x4Fbd235fB57eB883EEC84e358d96316285409c83',
      hardhat: '0x01d77e7CC19cc562adB17AD6Cb1F08f7a66fe301',
    },
  },
};

export function getCtrlFactoryConfig(networkName: string) {
  let config = {}
  if(networkName == "bsctest") {// bsc_test
    config = {
      defaultMaintainer: "0x589ebE0F71aCb0B037dD5eF616b72264C61fc8fb", //test account
      defaultMtFeeRateModel: "0x0aFDEDe9F2a9E3f79f2aa1B5F55c567AD5d3A211", // mockFeerateModel
      dodoApproveProxy: "0x0aFDEDe9F2a9E3f79f2aa1B5F55c567AD5d3A211", // mock approve
      weth: "0xA314A75563cCE9AeF91d132C72737aCf301E0735"
    }
  }
  return config
}