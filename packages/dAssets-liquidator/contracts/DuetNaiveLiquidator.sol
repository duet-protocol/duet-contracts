// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./interfaces/ILiquidateCallee.sol";
import "./interfaces/IController.sol";
import "./libs/Adminable.sol";
import "./interfaces/IDYToken.sol";

contract DuetNaiveLiquidator is ILiquidateCallee, Adminable, Initializable {
    IController public controller;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function initialize(address admin_, IController controller_) public initializer {
        admin = admin_;
        controller = controller_;
    }

    modifier onlyVault() {
        (, , , , , bool enableLiquidate) = controller.vaultStates(msg.sender);
        require(enableLiquidate, "Vault Only");
        _;
    }

    function setController(IController controller_) external onlyAdmin {
        controller = controller_;
    }

    function liquidate(address borrower_, bytes calldata data_) external onlyAdmin {
        controller.liquidate(borrower_, data_);
    }

    function liquidateDeposit(
        address borrower_,
        address underlying_,
        uint256 amount_,
        bytes calldata data_
    ) external onlyVault {}

    function liquidateBorrow(
        address borrower_,
        address underlying_,
        uint256 amount_,
        bytes calldata data_
    ) external onlyVault {
        // sender is vault
        IERC20Upgradeable(underlying_).safeApprove(msg.sender, amount_);
    }

    function transferTokenByAmount(
        IERC20Upgradeable token_,
        address to_,
        uint256 amount_
    ) public onlyAdmin {
        token_.safeTransfer(to_, amount_);
    }

    function transferToken(IERC20Upgradeable token_, address to_) public onlyAdmin {
        transferTokenByAmount(token_, to_, token_.balanceOf(address(this)));
    }

    function transferTokens(IERC20Upgradeable[] calldata tokens_) public onlyAdmin {
        for (uint256 i = 0; i < tokens_.length; i++) {
            IERC20Upgradeable token = tokens_[i];
            transferTokenByAmount(token, msg.sender, token.balanceOf(address(this)));
        }
    }

    function withdrawDyTokens(IDYToken[] calldata dyTokens_) external onlyAdmin {
        for (uint256 i = 0; i < dyTokens_.length; i++) {
            IDYToken dyToken = dyTokens_[i];
            dyToken.withdraw(msg.sender, IERC20Upgradeable(address(dyToken)).balanceOf(address(this)), false);
        }
    }

    function approveTokenByAmount(
        IERC20Upgradeable token_,
        address spender_,
        uint256 amount_
    ) public onlyAdmin {
        token_.safeApprove(spender_, amount_);
    }

    function approveToken(IERC20Upgradeable token_, address spender_) public onlyAdmin {
        approveTokenByAmount(token_, spender_, type(uint256).max);
    }
}
