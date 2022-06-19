//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/IPair.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IController.sol";
import "../interfaces/IUSDOracle.sol";
import "../interfaces/IRouter02.sol";
import "../interfaces/IPancakeFactory.sol";
import "../interfaces/IDusdMinter.sol";

import "../interfaces/IDYToken.sol";
import "../interfaces/IFeeConf.sol";
import "../interfaces/IMintVault.sol";
import "../interfaces/IDepositVault.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "../Constants.sol";

contract Reader is Constants {

  using SafeMath for uint;

  IFeeConf private feeConf;
  IController private controller;
  IPancakeFactory private factory;
  IRouter02 private router;
  
  address public minter;

  constructor(address _controller, address _feeConf, address _factory, address _router, address _minter) {
    controller = IController(_controller);
    feeConf = IFeeConf(_feeConf);
    factory = IPancakeFactory(_factory);
    router = IRouter02(_router);

    minter = _minter;
  }



  // underlyingAmount : such as lp amount;
  function getVaultPrice(address vault, uint underlyingAmount, bool _dp) external view returns(uint256 value) {
    // calc dytoken amount;
    address dytoken = IVault(vault).underlying();

    uint amount = IERC20(dytoken).totalSupply() * underlyingAmount / IDYToken(dytoken).underlyingTotal();
    value = IVault(vault).underlyingAmountValue(amount, _dp);
  } 
  
  function getAssetDiscount(address asset, bool lp) external view returns(uint16 dr){
    if (lp) {
      address token0 = IPair(asset).token0();
      address token1 = IPair(asset).token1();
      ( , uint16 dr0,  ,  , uint16 dr1, ) = controller.getValueConfs(token0, token1);
      dr = (dr0 + dr1) / 2;
    } else {
      ( , dr, ) = controller.getValueConf(asset);
    }
  }

  function getDTokenVaultPrice(address[] memory _vaults, address user, bool _dp)  external view returns(uint256[] memory amounts, 
    uint256[] memory prices,
    uint256[] memory values,
    uint256[] memory marketcaps) {
      uint len = _vaults.length;

      values = new uint[](len);
      amounts = new uint[](len);
      prices = new uint[](len);
      marketcaps = new uint[](len);

      for (uint256 i = 0; i < len; i++) {
          address dtoken = IVault(_vaults[i]).underlying();

          prices[i] = IVault(_vaults[i]).underlyingAmountValue(1e18, _dp);

          amounts[i] = IMintVault(_vaults[i]).borrows(user);
          values[i] = amounts[i] * prices[i] / 1e18;

          uint total = IERC20(dtoken).totalSupply();
          marketcaps[i] = total * prices[i] / 1e18;
      }
  }

  // 
  function depositVaultValues(address[] memory _vaults, bool _dp) external view returns (uint256[] memory amounts, uint256[] memory values) {
    uint len = _vaults.length;
    values = new uint[](len);
    amounts = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      address dytoken = IVault(_vaults[i]).underlying();
      require(dytoken != address(0), "no dytoken");

      uint amount = IERC20(dytoken).balanceOf(_vaults[i]);
      if (amount == 0) {
        amounts[i] = 0;
        values[i] = 0;
      } else {
        uint value =  IVault(_vaults[i]).underlyingAmountValue(amount, _dp);
        amounts[i] = amount;
        values[i] = value;
      }
    }
  }

  // 获取用户所有仓位价值:
  function userVaultValues(address _user, address[] memory  _vaults, bool _dp) external view returns (uint256[] memory values) {
    uint len = _vaults.length;
    values = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      values[i] = IVault(_vaults[i]).userValue(_user, _dp);
    }
  }

  // 获取用户所有仓位数量（dyToken 数量及底层币数量）
  function userVaultDepositAmounts(address _user, address[] memory _vaults) 
    external view returns (uint256[] memory amounts, uint256[] memory underAmounts) {
    uint len = _vaults.length;
    amounts = new uint[](len);
    underAmounts = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      amounts[i] = IDepositVault(_vaults[i]).deposits(_user);
      address underlying = IVault(_vaults[i]).underlying();
      if (amounts[i] == 0) {
        underAmounts[i] = 0;
      } else {
        underAmounts[i] = IDYToken(underlying).underlyingAmount(amounts[i]);
      }
    }
  }

    // 获取用户所有借款数量
  function userVaultBorrowAmounts(address _user, address[] memory _vaults) external view returns (uint256[] memory amounts) {
    uint len = _vaults.length;
    amounts = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      amounts[i] = IMintVault(_vaults[i]).borrows(_user);
    }
  }

// 根据输入，预估实际可借和费用
  function pendingBorrow(uint amount) external view returns(uint actualBorrow, uint fee) {
    (, uint borrowFee) = feeConf.getConfig("borrow_fee");

    fee = amount * borrowFee / PercentBase;
    actualBorrow = amount - fee;
  }

// 根据输入，预估实际转换和费用
  function pendingRepay(address borrower, address vault, uint amount) external view returns(uint actualRepay, uint fee) {
    uint256 borrowed = IMintVault(vault).borrows(borrower);
    if(borrowed == 0) {
      return (0, 0);
    }

    (address receiver, uint repayFee) = feeConf.getConfig("repay_fee");
    fee = borrowed * repayFee / PercentBase;
    if (amount > borrowed + fee) {  // repay all.
      actualRepay = borrowed;
    } else {
      actualRepay = amount * PercentBase / (PercentBase + repayFee);
      fee = amount - actualRepay;
    }
  }

  // 获取多个用户的价值 (only calculate valid vault)
  function usersVaules(address[] memory users, bool dp) external view returns(uint[] memory totalDeposits, uint[] memory totalBorrows) {
    uint len = users.length;
    totalDeposits = new uint[](len);
    totalBorrows = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      (totalDeposits[i], totalBorrows[i]) = controller.userValues(users[i], dp);
    }
  }

  // 获取多个用户的价值
  function usersTotalVaules(address[] memory users, bool dp) external view returns(uint[] memory totalDeposits, uint[] memory totalBorrows) {
    uint len = users.length;
    totalDeposits = new uint[](len);
    totalBorrows = new uint[](len);

    for (uint256 i = 0; i < len; i++) {
      (totalDeposits[i], totalBorrows[i]) = controller.userTotalValues(users[i], dp);
    }
  }

  function getValidVault(address vault, address user) external view returns(IController.ValidVault) {

    IController.ValidVault _state = controller.validVaultsOfUser(vault, user);

    IController.ValidVault state = 
        _state == IController.ValidVault.UnInit? controller.validVaults(vault) : _state;

    return state;
  }

  function getValueOfTokenToLp(
        address token, 
        uint amount, 
        address [] memory pathArr0,
        address [] memory pathArr1
    ) external view returns(
      uint inputVaule, 
      uint outputValue, 
      uint actualAmountOut0,
      uint actualAmountOut1
      ) {
        {
          (address oracle, ,) = controller.getValueConf(token);
          uint scale = 10 ** IERC20Metadata(token).decimals();
          inputVaule = IUSDOracle(oracle).getPrice(token) * amount / scale;
        }
        
        address token0;
        address token1;
        uint amountOut0;
        uint amountOut1;
        uint112[] memory reserves = new uint112[](2);

        {
          address lp;
          // get token reserves before swapping
          (reserves, lp) = _getReserves(token, pathArr0, pathArr1);

          (token0, amountOut0, reserves) = _predictSwapAmount(token, amount / 2, pathArr0, reserves, lp);
          (token1, amountOut1, reserves) = _predictSwapAmount(token, amount - amount / 2, pathArr1, reserves, lp);
        }
        _checkAmountOut(token0, token1, amountOut0, amountOut1);

        (actualAmountOut0, actualAmountOut1) = _getQuoteAmount(token0, amountOut0, token1, amountOut1, reserves);

        uint price0 = _getPrice(token, pathArr0);
        uint price1 = _getPrice(token, pathArr1);

        uint scale0 = 10 ** IERC20Metadata(token0).decimals();
        uint scale1 = 10 ** IERC20Metadata(token1).decimals();

        outputValue = actualAmountOut0 * price0 / scale0 + actualAmountOut1 * price1 / scale1;
    }

    function getValueOfTokenToToken(
        address token, 
        uint amount, 
        address [] memory pathArr
    ) external view returns(uint inputVaule, uint outputValue, uint amountOut) {
        (address oracle, ,) = controller.getValueConf(token);
        uint scaleIn = 10 ** IERC20Metadata(token).decimals();
        inputVaule = IUSDOracle(oracle).getPrice(token) * amount / scaleIn;

        address targetToken;
        uint112[] memory reserves = new uint112[](2);

        (targetToken, amountOut, reserves) = _predictSwapAmount(token, amount, pathArr, reserves, address(0));

        uint price = _getPrice(token, pathArr);

        uint scaleOut = 10 ** IERC20Metadata(targetToken).decimals();

        outputValue = amountOut * price / scaleOut;
    }

    function _predictSwapAmount(
        address originToken,
        uint amount, 
        address [] memory pathArr,
        uint112 [] memory reserves,
        address lp
    ) internal view returns (address targetToken, uint amountOut, uint112 [] memory _reserves) {
        if (pathArr.length == 0) {
              return (originToken, amount, reserves);
        }

        // check busd -> dusd
        for (uint i = 0; i < pathArr.length; i++) {
            if(pathArr[i] == IDusdMinter(minter).stableToken() && i < pathArr.length - 1) {
                if(pathArr[i+1] == IDusdMinter(minter).dusd()) {
                    return _predictSwapOfStableTokentoDUSD(pathArr, i, amount, reserves, lp);
                }
            }
        }

        (amountOut, _reserves) = _getAmountOut(amount, pathArr, reserves, lp);
        return (pathArr[pathArr.length - 1], amountOut, _reserves);
    }

    function _predictSwapOfStableTokentoDUSD(
        address[] memory pathArr, 
        uint position,
        uint amount,
        uint112 [] memory reserves,
        address lp
        ) internal view returns(address targetToken, uint amountOut, uint112 [] memory _reserves) {
        uint len = pathArr.length;

        // len = 2, busd -> dusd
        if(len == 2) {
            (amountOut, ) = IDusdMinter(minter).calcOutputFee(amount);
            return (pathArr[1], amountOut, reserves);
        }

        // len > 2, ...busd -> dusd...
        uint busdAmout;
        uint dusdAmount;
        if(position == 0) {
            // busd -> dusd, and then swap [dusd, ...]
            (dusdAmount, ) = IDusdMinter(minter).calcOutputFee(amount);
            address[] memory newPathArr = _fillArrbyPosition(1, len-1, pathArr);
            (amountOut, _reserves) = _getAmountOut(dusdAmount, newPathArr, reserves, lp);
            return (pathArr[pathArr.length - 1], amountOut, _reserves);
        }else if(position == len - 2) {
            // swap [..., busd], and then busd -> dusd
            address[] memory newPathArr = _fillArrbyPosition(0, len-2, pathArr);
            (busdAmout, _reserves) = _getAmountOut(amount, newPathArr, reserves, lp);
            (amountOut, ) = IDusdMinter(minter).calcOutputFee(busdAmout);
            return (pathArr[pathArr.length - 1], amountOut, _reserves);
        } else {
            // swap [..., busd], and then busd -> dusd, and swap [dusd, ...]
            address[] memory newPathArr0 = _fillArrbyPosition(0, position, pathArr);
            address[] memory newPathArr1 = _fillArrbyPosition(position+1, len-1, pathArr);
            (busdAmout, _reserves) = _getAmountOut(amount, newPathArr0, reserves, lp);
            (dusdAmount, ) = IDusdMinter(minter).calcOutputFee(busdAmout);
            (amountOut, _reserves) = _getAmountOut(dusdAmount, newPathArr1, _reserves, lp);
            return (pathArr[pathArr.length - 1], amountOut, _reserves);
        }
    }
    
    function _fillArrbyPosition(
        uint start,
        uint end,
        address[] memory originArr
    ) internal view returns (address[] memory) {
        uint newLen = end-start+1;
        address[] memory newArr = new address[](newLen);
        for (uint i = 0; i < newLen; i++) {
            newArr[i] = originArr[i+start];
        }
        return newArr;
    }

    function _getAmountOut(
      uint amount, 
      address[] memory path,
      uint112 [] memory reserves,
      address lp
      ) internal view returns (uint amountOut, uint112 [] memory){
  
        if(lp != address(0)){
          // swap Token to Lp. 
          IPair pair = IPair(lp);
          address token0 = pair.token0();
          address token1 = pair.token1();
          uint slow = 0;
          uint fast = 1;
          uint start = 0; // currently start to swap

          amountOut = amount;

          for (fast; fast < path.length; fast++) {
            if(path[slow] == token0 && path[fast] == token1) {
              // token0 -> token1
              if(start < slow) {
                // ... -> token0, token0 -> token1
                address[] memory newPathArr = _fillArrbyPosition(start, slow, path);
                amountOut = _tryToGetAmountsOut(amountOut, newPathArr);
                uint token0GapAmount = amountOut;
                amountOut = _getAmountsOutByReserves(token0GapAmount, uint(reserves[0]), uint(reserves[1]));
                uint token1GapAmount = amountOut;
                reserves[0] += uint112(token0GapAmount);
                reserves[1] -= uint112(token1GapAmount);
              } else {
                // start = slow, means token0 -> token1
                uint token0GapAmount = amountOut;
                amountOut = _getAmountsOutByReserves(token0GapAmount, uint(reserves[0]), uint(reserves[1]));
                uint token1GapAmount = amountOut;
                reserves[0] += uint112(token0GapAmount);
                reserves[1] -= uint112(token1GapAmount);
              }
              // reassignment
              start = fast;
            } else if(path[slow] == token1 && path[fast] == token0) {
              // token1 -> token0
              if(start < slow) {
                // ... -> token1, token1 -> token0
                address[] memory newPathArr = _fillArrbyPosition(start, slow, path);
                amountOut = _tryToGetAmountsOut(amountOut, newPathArr);
                uint token1GapAmount = amountOut;
                amountOut = _getAmountsOutByReserves(token1GapAmount, uint(reserves[1]), uint(reserves[0]));
                uint token0GapAmount = amountOut;
                reserves[1] += uint112(token1GapAmount);
                reserves[0] -= uint112(token0GapAmount);
              } else {
                // start = slow, means token1 -> token0
                uint token1GapAmount = amountOut;
                amountOut = _getAmountsOutByReserves(token1GapAmount, uint(reserves[1]), uint(reserves[0]));
                uint token0GapAmount = amountOut;
                reserves[1] += uint112(token1GapAmount);
                reserves[0] -= uint112(token0GapAmount);
              }
              // reassignment
              start = fast;
            } else {
              if(fast == path.length - 1) {
                // path end
                address[] memory newPathArr = _fillArrbyPosition(start, fast, path);
                amountOut = _tryToGetAmountsOut(amountOut, newPathArr);
              }
            }
            slow++;
          }

        } else {
          // swap Token to Token
          amountOut = _tryToGetAmountsOut(amount, path);
        }
        return(amountOut, reserves);
    }

    function _tryToGetAmountsOut(
      uint amount, 
      address[] memory path
    ) internal view returns(uint amountOut) {
      try router.getAmountsOut(amount, path) returns (uint[] memory amounts) {
        amountOut = amounts[amounts.length - 1];
      } catch {
        revert("Wrong Path");
      }
    }

    function _getAmountsOutByReserves(
      uint amountIn, 
      uint reserveIn, 
      uint reserveOut
    ) internal view returns(uint amountOut) {
      require(amountIn > 0, 'Reader: INSUFFICIENT_INPUT_AMOUNT');
      require(reserveIn > 0 && reserveOut > 0, 'Reader: INSUFFICIENT_LIQUIDITY');
      uint amountInWithFee = amountIn.mul(9975);
      uint numerator = amountInWithFee.mul(reserveOut);
      uint denominator = reserveIn.mul(10000).add(amountInWithFee);
      amountOut = numerator / denominator;
    }

    function _getPrice(
        address token,
        address[] memory pathArr
    ) internal view returns (uint price) {
        if (pathArr.length == 0) {
            // tokenInput 
            (address oracle, ,) = controller.getValueConf(token);
            return IUSDOracle(oracle).getPrice(token);
        }
        // tokenOutput
        address _token = pathArr[pathArr.length - 1];
        (address oracle, ,) = controller.getValueConf(token);
        price = IUSDOracle(oracle).getPrice(_token);
    }

    function _getQuoteAmount(
        address token0,
        uint amountOut0,
        address token1,
        uint amountOut1,
        uint112[] memory reserves
    ) internal view returns (uint actualAmountOut0, uint actualAmountOut1) {
        address lp = factory.getPair(token0, token1);
        IPair pair = IPair(lp);
        address _token0 = pair.token0();
        address _token1 = pair.token1();

        uint112 reserve0 = reserves[0];
        uint112 reserve1 = reserves[1];
        
        if(_token0 != token0) {
          // switch places when not match
          uint112 temp = reserve0;
          reserve0 = reserve1;
          reserve1 = temp;
        }

        uint quoteAmountOut1 = router.quote(amountOut0, reserve0, reserve1);
        uint quoteAmountOut0 = router.quote(amountOut1, reserve1, reserve0);

        if(quoteAmountOut1 <= amountOut1) {
          return(amountOut0, quoteAmountOut1);
        } else if(quoteAmountOut0 <= amountOut0) {
          return(quoteAmountOut0, amountOut1);
        } else {
          revert("Reader: predict addLiquidity error");
        }
    }

    function _checkAmountOut(
        address token0,
        address token1,
        uint amountOut0,
        uint amountOut1
    ) internal view {
        address lp = factory.getPair(token0, token1);
        IPair pair = IPair(lp);
        address _token0 = pair.token0();
        address _token1 = pair.token1();

        require(amountOut0 > 0 && amountOut1 > 0, "Wrong Path: amountOut is zero");
        require(token0 == _token0 || token0 == _token1, "Wrong Path: target tokens don't match");
        require(token1 == _token0 || token1 == _token1, "Wrong Path: target tokens don't match");
    }

    function _getReserves(
        address token,
        address[] memory pathArr0,
        address[] memory pathArr1
    ) internal view returns(uint112[] memory, address lp){
        address token0 = pathArr0.length == 0? token: pathArr0[pathArr0.length - 1];
        address token1 = pathArr1.length == 0? token: pathArr1[pathArr1.length - 1];

        require(token0 != token1, "Zap: target tokens should't be the same");

        lp = factory.getPair(token0, token1);
        IPair pair = IPair(lp);

        uint112[] memory _reserves = new uint112[](2);
        (_reserves[0], _reserves[1], ) = pair.getReserves();
        return (_reserves, lp);
    }
}
