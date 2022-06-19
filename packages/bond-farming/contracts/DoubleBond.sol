//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./Epoch.sol";
import "./CloneFactory.sol";

contract DoubleBond is AccessControl, CloneFactory{
    using SafeERC20 for IERC20;
    using Strings for uint256;

    Epoch[] private epoches;
    address private borrowtoken;
    address private staketoken;
    address private clearer;
    address private debtor;
    uint256 private start;
    uint256 private duration;
    uint256 private phasenum;
    uint256 private nowend;
    address public epochImp;

    event NewEpoch(address indexed epoch);

    function getEpoches() external view returns(Epoch[] memory){
        return epoches;
    }



    function getEpoch(uint256 id) external view returns(address){
        return address(epoches[id]);
    }

    function getborrowtoken() external view returns(address){
        return borrowtoken;
    }
    
    
    function getstaketoken() external view returns(address){
        return staketoken;
    }

    function getborroetoken() external view returns(address){
        return borrowtoken;
    }

    function getDebtor() external view returns(address){
        return debtor;
    }

    function getStart() external view returns(uint256){
        return start;
    }

    function getDuration() external view returns(uint256){
        return duration;
    }

    function getPhasenum() external view returns(uint256){
        return phasenum;
    }

    function setEpochImp(address _epochImp) external onlyRole(DEFAULT_ADMIN_ROLE) {
        epochImp = _epochImp;
    }

    constructor(address _borrowtoken,address _staketoken, uint256 _start, uint256 _duration, uint256 _phasenum,uint256 _principal,uint256 _interestone,address _debtor,address _clearer) {  
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
        borrowtoken = _borrowtoken;
        staketoken = _staketoken;
        debtor = _debtor;
        clearer = _clearer;
        start = _start;
        duration = _duration;
        phasenum = _phasenum;
        // IERC20 token = IERC20(staketoken);
        for (uint256 i = 0; i < phasenum; i++){
            uint256 epstart = start + i * duration;
            uint256 amount = _interestone;
            if(i == phasenum - 1){
                amount = _principal + _interestone;
            }
            string memory name = string(abi.encodePacked(string(abi.encodePacked(duration.toString(),  "Epoch#")), i.toString()));
            string memory symbol = string(abi.encodePacked(string(abi.encodePacked(duration.toString(),  "EP#")), i.toString()));
             
            Epoch ep = Epoch(createClone(epochImp));
            ep.initialize(borrowtoken, epstart, debtor, amount, name, symbol);
            epoches.push(ep);
            emit NewEpoch(address(ep));
        }
        nowend = start + phasenum * duration;
    }

    //renewal bond will start at next phase
    function renewal (uint256 _phasenum,uint256 _principal,uint256 _interestone) external onlyRole(DEFAULT_ADMIN_ROLE){
        uint256 needcreate = 0;
        uint256 newstart = nowend;
        uint256 renewphase = (block.timestamp - start)/duration + 1;
        if(block.timestamp + duration >= nowend){ 
            needcreate = _phasenum;
            newstart = block.timestamp;
            start = block.timestamp;
        }
        if(block.timestamp + duration*_phasenum <= nowend){ 
            needcreate = 0;
        }else{
            needcreate = _phasenum - (nowend - block.timestamp)/duration;
        }
        uint256 needrenew = _phasenum - needcreate;
        // IERC20 token = IERC20(staketoken);
        // token.safeTransferFrom(msg.sender, address(this), _stakenum);

        for(uint256 i = 0; i < needrenew; i++){
            Epoch renewEP = epoches[renewphase+i];
            uint256 amount = _interestone;
            if(i == _phasenum-1){
                amount = _interestone + _principal;
            }
            renewEP.mint(debtor, amount);
            // token.safeTransferFrom(msg.sender, address(renewEP), amount);
        }
        for(uint256 j = 0; j < needcreate; j++){
            uint256 amount = _interestone;
            if(needrenew + j == phasenum - 1){
                amount = _principal + _interestone;
            }
            uint256 idnum = epoches.length - 1;
            string memory name = string(abi.encodePacked(string(abi.encodePacked(duration.toString(),  "Epoch#")), (j+idnum).toString()));
            string memory symbol = string(abi.encodePacked(string(abi.encodePacked(duration.toString(),  "EP#")), (j+idnum).toString()));
             
            Epoch ep = Epoch(createClone(epochImp));
            ep.initialize(borrowtoken, newstart + (j*duration), debtor, amount, name, symbol);
            epoches.push(ep);
            // token.safeTransferFrom(msg.sender, address(ep), amount);
        }

        nowend = newstart + needcreate * duration;
        phasenum = phasenum + needcreate;
    }

    function withdraw_stake(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE){
        IERC20 token = IERC20(staketoken);
        token.safeTransferFrom(address(this), debtor, amount);
    }

    function clear() external onlyRole(DEFAULT_ADMIN_ROLE){
        IERC20 token = IERC20(staketoken);
        token.safeTransferFrom(address(this), clearer, token.balanceOf(address(this)));
        //TODO
    }

    function repay() external{
        uint256 repayphase = (block.timestamp - start)/duration;
        Epoch ep = epoches[repayphase];
        IERC20 token = IERC20(borrowtoken);
        token.safeTransferFrom(msg.sender, address(ep), ep.totalSupply());
        //TODO
    }

}
