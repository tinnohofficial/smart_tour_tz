// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/SmartTourVault.sol";
import "../src/ISwapRouter.sol";

// ----------------------------
// MockERC20
// ----------------------------
contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero");
        require(to != address(0), "ERC20: transfer to zero");
        require(_balances[from] >= amount, "ERC20: insufficient balance");

        unchecked {
            _balances[from] -= amount;
        }
        _balances[to] += amount;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to zero");
        _totalSupply += amount;
        _balances[account] += amount;
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0) && spender != address(0), "ERC20: approve zero");
        _allowances[owner][spender] = amount;
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 current = _allowances[owner][spender];
        require(current >= amount, "ERC20: insufficient allowance");
        unchecked {
            _allowances[owner][spender] = current - amount;
        }
    }
}

// ----------------------------
// MockSwapRouter
// ----------------------------
contract MockSwapRouter is ISwapRouter {
    MockERC20 public usdt;
    uint256 public rate = 2;

    constructor(address _usdt) {
        usdt = MockERC20(_usdt);
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable override returns (uint256) {
        uint256 out = params.amountIn * rate;
        usdt.mint(params.recipient, out);
        return out;
    }

    function exactInput(ExactInputParams calldata) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function exactOutputSingle(ExactOutputSingleParams calldata) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function exactOutput(ExactOutputParams calldata) external payable override returns (uint256) {
        revert("Not implemented");
    }

    function uniswapV3SwapCallback(int256, int256, bytes calldata) external pure override {
        revert("Not implemented");
    }
}

// ----------------------------
// Main Test Contract
// ----------------------------
contract SmartTourVaultTest is Test {
    address user = address(0x123);
    address owner = address(0xabc);

    MockERC20 usdt;
    MockERC20 other;
    MockSwapRouter router;
    SmartTourVault vault;

    uint256 constant INITIAL = 10000 ether;
    uint256 constant DEPOSIT = 100 ether;

    function setUp() public {
        usdt = new MockERC20("USDT", "USDT");
        other = new MockERC20("OTH", "OTH");

        router = new MockSwapRouter(address(usdt));

        vm.prank(owner);
        vault = new SmartTourVault(address(usdt), address(router));

        usdt.mint(user, INITIAL);
        other.mint(user, INITIAL);

        vm.startPrank(user);
        usdt.approve(address(vault), type(uint256).max);
        other.approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    function testDepositUSDT() public {
        vm.prank(user);
        vault.deposit(address(usdt), DEPOSIT);

        assertEq(vault.getUserBalance(user), DEPOSIT, "User vault balance wrong");
        assertEq(usdt.balanceOf(user), INITIAL - DEPOSIT, "User USDT should be reduced");
        assertEq(usdt.balanceOf(address(vault)), DEPOSIT, "Vault should hold USDT");
    }

    function testDepositOtherToken() public {
        vm.prank(user);
        vault.deposit(address(other), DEPOSIT);

        uint256 expected = DEPOSIT * 2;
        assertEq(vault.getUserBalance(user), expected, "User balance should reflect swapped USDT");
        assertEq(other.balanceOf(user), INITIAL - DEPOSIT, "User OTH should be reduced");
        assertEq(usdt.balanceOf(address(vault)), expected, "Vault should hold converted USDT");
    }

    function testPayFromSavings() public {
        vm.prank(user);
        vault.deposit(address(usdt), DEPOSIT);

        vm.prank(owner);
        vault.payFromSavings(user, 30 ether);

        assertEq(vault.getUserBalance(user), DEPOSIT - 30 ether, "User balance should decrease");
    }

    function testPayFromSavingsInsufficientFunds() public {
        vm.prank(user);
        vault.deposit(address(usdt), 10 ether);

        vm.prank(owner);
        vm.expectRevert("Insufficient funds");
        vault.payFromSavings(user, 20 ether);
    }

    function testAdminWithdraw() public {
        vm.prank(user);
        vault.deposit(address(usdt), DEPOSIT);

        vm.prank(owner);
        vault.adminWithdraw(address(usdt), 50 ether);

        assertEq(usdt.balanceOf(owner), 50 ether, "Owner should receive tokens");
        assertEq(usdt.balanceOf(address(vault)), DEPOSIT - 50 ether, "Vault balance reduced");
    }

    function testOnlyOwnerCanWithdraw() public {
        vm.prank(user);
        vault.deposit(address(usdt), DEPOSIT);

        vm.prank(user);
        vm.expectRevert();
        vault.adminWithdraw(address(usdt), 10 ether);
    }
}
