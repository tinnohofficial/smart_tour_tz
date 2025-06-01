// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {TanzaniaShillingCoin} from "../src/TanzaniaShillingCoin.sol";
import {SmartTourVault} from "../src/SmartTourVault.sol";

contract TanzaniaShillingCoinTest is Test {
    TanzaniaShillingCoin public tzcToken;
    SmartTourVault public vault;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion TZC
    uint256 public constant TEST_AMOUNT = 1000 * 10**18; // 1000 TZC

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy TZC token
        tzcToken = new TanzaniaShillingCoin();
        
        // Deploy vault with TZC token
        vault = new SmartTourVault(address(tzcToken));
        
        // Transfer some tokens to test users
        tzcToken.transfer(user1, TEST_AMOUNT);
        tzcToken.transfer(user2, TEST_AMOUNT);
    }

    function testInitialState() public {
        assertEq(tzcToken.name(), "Tanzania Shilling Coin");
        assertEq(tzcToken.symbol(), "TZC");
        assertEq(tzcToken.decimals(), 18);
        assertEq(tzcToken.totalSupply(), INITIAL_SUPPLY);
        assertEq(tzcToken.balanceOf(owner), INITIAL_SUPPLY - (TEST_AMOUNT * 2));
        assertEq(tzcToken.balanceOf(user1), TEST_AMOUNT);
        assertEq(tzcToken.balanceOf(user2), TEST_AMOUNT);
    }

    function testMint() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 initialSupply = tzcToken.totalSupply();
        
        tzcToken.mint(user1, mintAmount);
        
        assertEq(tzcToken.totalSupply(), initialSupply + mintAmount);
        assertEq(tzcToken.balanceOf(user1), TEST_AMOUNT + mintAmount);
    }

    function testBurn() public {
        uint256 burnAmount = 100 * 10**18;
        uint256 initialBalance = tzcToken.balanceOf(user1);
        uint256 initialSupply = tzcToken.totalSupply();
        
        vm.prank(user1);
        tzcToken.burn(burnAmount);
        
        assertEq(tzcToken.balanceOf(user1), initialBalance - burnAmount);
        assertEq(tzcToken.totalSupply(), initialSupply - burnAmount);
    }

    function testVaultDeposit() public {
        uint256 depositAmount = 500 * 10**18;
        
        vm.startPrank(user1);
        
        // Approve vault to spend tokens
        tzcToken.approve(address(vault), depositAmount);
        
        // Deposit to vault
        vault.deposit(depositAmount);
        
        // Check balances
        assertEq(vault.getUserBalance(user1), depositAmount);
        assertEq(tzcToken.balanceOf(user1), TEST_AMOUNT - depositAmount);
        assertEq(tzcToken.balanceOf(address(vault)), depositAmount);
        
        vm.stopPrank();
    }

    function testVaultPayment() public {
        uint256 depositAmount = 500 * 10**18;
        uint256 paymentAmount = 200 * 10**18;
        
        // User1 deposits to vault
        vm.startPrank(user1);
        tzcToken.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Owner (admin) processes payment from user1's vault balance
        vault.payFromSavings(user1, paymentAmount);
        
        // Check remaining balance
        assertEq(vault.getUserBalance(user1), depositAmount - paymentAmount);
    }

    function testFailMintUnauthorized() public {
        vm.prank(user1);
        tzcToken.mint(user1, 1000 * 10**18); // Should fail - user1 is not owner
    }

    function testFailVaultInsufficientFunds() public {
        uint256 paymentAmount = 1000 * 10**18;
        
        // Try to pay more than user has in vault (should fail)
        vault.payFromSavings(user1, paymentAmount);
    }

    function testTransfer() public {
        uint256 transferAmount = 100 * 10**18;
        
        vm.prank(user1);
        tzcToken.transfer(user2, transferAmount);
        
        assertEq(tzcToken.balanceOf(user1), TEST_AMOUNT - transferAmount);
        assertEq(tzcToken.balanceOf(user2), TEST_AMOUNT + transferAmount);
    }

    function testApproveAndTransferFrom() public {
        uint256 approveAmount = 200 * 10**18;
        uint256 transferAmount = 150 * 10**18;
        
        // user1 approves user2 to spend tokens
        vm.prank(user1);
        tzcToken.approve(user2, approveAmount);
        
        assertEq(tzcToken.allowance(user1, user2), approveAmount);
        
        // user2 transfers from user1's account
        vm.prank(user2);
        tzcToken.transferFrom(user1, user2, transferAmount);
        
        assertEq(tzcToken.balanceOf(user1), TEST_AMOUNT - transferAmount);
        assertEq(tzcToken.balanceOf(user2), TEST_AMOUNT + transferAmount);
        assertEq(tzcToken.allowance(user1, user2), approveAmount - transferAmount);
    }
}