//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


import "@private/shared/3rd/chainlink/AggregatorV3Interface.sol";
import "@private/shared/libs/Adminable.sol";


contract MockOracleUSDAggregator is AggregatorV3Interface, Adminable {

  constructor(address admin_) {
    require(admin_ != address(0), "Cant set admin to zero address");
    _setAdmin(admin_);
  }


  int256 public mock_r_answer = 720240;
  function updateMockRoundAnswer(int256 v_) external onlyAdmin {
    mock_r_answer = v_;
  }

  function decimals() external pure returns (uint8) {
    return 8;
  }

  function description() external pure returns (string memory) {
    return 'DuetMock / USD';
  }

  function version() external pure returns (uint256) {
    return 0;
  }

  function getRoundData(uint80 _roundId) external view returns (
    uint80 roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
  ) {
    roundId = _roundId;
    answer = mock_r_answer;
    startedAt = 1657794069;
    updatedAt = 1657794069;
    answeredInRound = 36893488147419161920;
  }

  function latestRoundData() external view returns (
    uint80 roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
  ) {
    roundId = 36893488147419161920;
    answer = mock_r_answer;
    startedAt = 1657794069;
    updatedAt = 1657794069;
    answeredInRound = 36893488147419161920;
  }

}
