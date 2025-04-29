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
    function transfer(address to, uint256 amount) external returns (bool) {
    require(balanceOf[msg.sender] >= amount, "Not enough balance");
    balanceOf[msg.sender] -= amount;
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
    
    function testPayFromSavings() public {
    // Give user 100 USDT and approve
    vm.prank(user);
    usdt.approve(address(saveFunds), 100e6);

    vm.prank(user);
    saveFunds.deposit(100e6);

    //Mint 100 USDT directly to the smart contract to simulate funds held by system
    usdt.mint(address(saveFunds), 100e6); //

    emit log_named_uint("User contract balance before payFromSavings", saveFunds.getBalance(user));
    emit log_named_uint("Token balance held by contract", usdt.balanceOf(address(saveFunds)));
    emit log_named_address("Booking system address", address(this));

    //Simulate booking/payment
    address serviceProvider = address(0xABCD); // e.g., hotel or tour operator

    saveFunds.payFromSavings(user, 60e6, serviceProvider);

    //Check balances
    uint256 remaining = saveFunds.getBalance(user);
    assertEq(remaining, 40e6, "Remaining balance should be 40 USDT");

    uint256 providerBalance = usdt.balanceOf(serviceProvider);
    assertEq(providerBalance, 60e6, "Provider should receive 60 USDT");
}

}
