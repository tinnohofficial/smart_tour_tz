// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SmartTourVault is Ownable {
    IERC20 public tzcToken;

    using SafeERC20 for IERC20;

    mapping(address => uint256) private tzcBalances;

    event Deposit(address indexed user, uint256 amount);
    event PaymentFromSavings(address indexed user, uint256 amount);

    constructor(address _tzcTokenAddress) Ownable(msg.sender) {
        tzcToken = IERC20(_tzcTokenAddress);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        tzcToken.safeTransferFrom(msg.sender, address(this), amount);
        tzcBalances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function getUserBalance(address user) external view returns (uint256) {
        return tzcBalances[user];
    }

    function payFromSavings(address user, uint256 amount) external onlyOwner {
        require(tzcBalances[user] >= amount, "Insufficient funds");
        tzcBalances[user] -= amount;
        emit PaymentFromSavings(user, amount);
    }

    function adminWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        tzcToken.safeTransfer(msg.sender, amount);
    }
}