// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SaveCryptoFunds {
    IERC20 public usdtToken;
    address public bookingSystem;

    mapping(address => uint256) public balances;

    event FundsSaved(address indexed user, uint256 amount);
    event FundsUsed(address indexed user, uint256 amount, address to);

    constructor(address _usdtTokenAddress, address _bookingSystem) {
        usdtToken = IERC20(_usdtTokenAddress);
        bookingSystem = _bookingSystem;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        bool success = usdtToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        balances[msg.sender] += amount;
        emit FundsSaved(msg.sender, amount);
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function payFromSavings(address user, uint256 amount, address to) external {
        require(msg.sender == bookingSystem, "Not authorized");
        require(balances[user] >= amount, "Insufficient funds");

        balances[user] -= amount;

        bool success = usdtToken.transfer(to, amount);
        require(success, "USDT transfer failed");

        emit FundsUsed(user, amount, to);
    }
}
