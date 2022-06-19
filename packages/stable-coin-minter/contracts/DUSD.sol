//SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./interfaces/TokenRecipient.sol";

contract DUSD is ERC20, ERC20Permit, Ownable {

  using Address for address;

  mapping(address => bool) public miners;

  event MinerChanged(address indexed miner, bool enabled);

  constructor() ERC20("Duet USD", "dUSD") ERC20Permit("Duet USD") {
    _mint(msg.sender, 0);
  }

  function addMiner(address _miner) public onlyOwner {
    miners[_miner] = true;
    emit MinerChanged(_miner, true);
  }

  function removeMiner(address _miner) public onlyOwner {
    miners[_miner] = false;
    emit MinerChanged(_miner, false);
  }


  function mint(address to, uint256 amount) public {
    require(miners[msg.sender], "invalid miner");
    _mint(to, amount);
  }

  function burn(uint256 amount) public {
    _burn(msg.sender, amount);
  }

  function send(address recipient, uint256 amount, bytes calldata exData) external returns (bool) {
    _transfer(msg.sender, recipient, amount);

    if (recipient.isContract()) {
      bool rv = TokenRecipient(recipient).tokensReceived(msg.sender, amount, exData);
      require(rv, "No tokensReceived");
    }

    return true;
  }

}