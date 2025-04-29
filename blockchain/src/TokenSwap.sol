// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract TokenSwap {
    IERC20 public usdtToken;
    IERC20 public tourToken;
    uint256 public swapRate = 10; // 1 USDT = 10 TOUR

    event TokensSwapped(address indexed user, uint256 usdtAmount, uint256 tourAmount);

    constructor(address _usdtToken, address _tourToken) {
        usdtToken = IERC20(_usdtToken);
        tourToken = IERC20(_tourToken);
    }

    function swapUSDTForTOUR(uint256 usdtAmount) external {
        require(usdtAmount > 0, "Amount must be greater than zero");

        // Transfer USDT from user to this contract
        bool received = usdtToken.transferFrom(msg.sender, address(this), usdtAmount);
        require(received, "USDT transfer failed");

        // Calculate TOUR tokens to send
        uint256 tourAmount = usdtAmount * swapRate;

        // Transfer TOUR tokens to the user
        bool sent = tourToken.transfer(msg.sender, tourAmount);
        require(sent, "TOUR transfer failed");

        emit TokensSwapped(msg.sender, usdtAmount, tourAmount);
    }
}
