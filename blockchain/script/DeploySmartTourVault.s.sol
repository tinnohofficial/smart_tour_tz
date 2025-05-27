// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {SmartTourVault} from "../src/SmartTourVault.sol";
import {console} from "forge-std/console.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6; // USDT has 6 decimals
    }
}

contract DeploySmartTourVault is Script {
    function run() external returns (SmartTourVault) {
        // Read environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // address usdtTokenAddress = vm.envAddress("USDT_ADDRESS");
        address swapRouterAddress = vm.envAddress("SWAP_ROUTER_ADDRESS");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        MockUSDT usdtToken = new MockUSDT();
        address usdtTokenAddress = address(usdtToken);

        // Deploy the contract
        SmartTourVault vault = new SmartTourVault(usdtTokenAddress, swapRouterAddress);

        // Stop broadcasting
        vm.stopBroadcast();

        // Output deployment information
        console.log("SmartTourVault deployed at: ", address(vault));

        return vault;
    }
}
