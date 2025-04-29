// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISwapRouter} from "./ISwapRouter.sol";

contract SmartTourVault is Ownable {
    IERC20 public usdtToken;
    ISwapRouter public swapRouter;

    using SafeERC20 for IERC20;

    mapping(address => uint256) private usdtBalances;

    constructor(address _usdtTokenAddress, address _swapRouter) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtTokenAddress);
        swapRouter = ISwapRouter(_swapRouter);
    }

    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        if (token == address(usdtToken)) {
            usdtBalances[msg.sender] += amount;
        } else {
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: token,
                tokenOut: address(usdtToken),
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

            uint256 usdtAmount = swapRouter.exactInputSingle(params);
            usdtBalances[msg.sender] += usdtAmount;
        }
    }

    function getUserBalance(address user) external view returns (uint256) {
        return usdtBalances[user];
    }

    function payFromSavings(address user, uint256 amount) external onlyOwner {
        require(usdtBalances[user] >= amount, "Insufficient funds");
        usdtBalances[user] -= amount;
    }

    function adminWithdraw(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}