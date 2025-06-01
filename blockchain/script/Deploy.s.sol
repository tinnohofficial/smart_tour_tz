// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TanzaniaShillingCoin} from "../src/TanzaniaShillingCoin.sol";
import {SmartTourVault} from "../src/SmartTourVault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TZC token first
        TanzaniaShillingCoin tzcToken = new TanzaniaShillingCoin();
        console.log("TZC Token deployed at:", address(tzcToken));

        // Deploy SmartTourVault with TZC token address
        SmartTourVault vault = new SmartTourVault(address(tzcToken));
        console.log("SmartTourVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
