// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

// Minimal mock ERC20 for USDT
contract MockUSDT {
    string public name = "Mock USDT";
    string public symbol = "mUSDT";
    uint8 public decimals = 6;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Not enough balance");
        require(allowance[from][msg.sender] >= amount, "Not approved");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

import "../src/SaveCryptoFunds.sol";

contract SaveCryptoFundsTest is Test {
    SaveCryptoFunds public saveFunds;
    MockUSDT public usdt;
    address user = address(0x123);

    function setUp() public {
    usdt = new MockUSDT();
    
    // Simulate the system (you) as the booking system
    address bookingSystem = address(this);

    saveFunds = new SaveCryptoFunds(address(usdt), bookingSystem);

    usdt.mint(user, 100e6); // Mint 100 USDT to the user
}


    function testDepositFunds() public {
        vm.prank(user);
        usdt.approve(address(saveFunds), 50e6); // Approve 50 USDT

        vm.prank(user);
        saveFunds.deposit(50e6); // Deposit 50 USDT

        uint256 balance = saveFunds.getBalance(user);
        assertEq(balance, 50e6, "Balance should be 50 USDT");
    }
}
