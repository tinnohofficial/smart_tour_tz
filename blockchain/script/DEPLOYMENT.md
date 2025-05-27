# SmartTourVault Deployment Guide

This guide explains how to deploy and verify the SmartTourVault contract on the Sepolia testnet.

## Prerequisites

1. [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
2. An Ethereum wallet with Sepolia ETH
3. An API key from [Etherscan](https://etherscan.io/apis)
4. An API key from an Ethereum node provider like [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)

## Setup

1. Update the `.env` file with your:
   - Private key (without 0x prefix)
   - USDT token address on Sepolia
   - Swap router address on Sepolia
   - Etherscan API key
   - Sepolia RPC URL

```sh
# .env file example
PRIVATE_KEY=your_private_key_here
USDT_ADDRESS=0x1E70972EC6d8e93d36e67BC6cCD48c5a4Dfc8e73
SWAP_ROUTER_ADDRESS=0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD
ETHERSCAN_API_KEY=your_etherscan_api_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key_here
```

## Deployment

### Option 1: Using the deployment script

1. Make the deployment script executable:
```sh
chmod +x script/deploy_and_verify.sh
```

2. Run the deployment script:
```sh
./script/deploy_and_verify.sh
```

### Option 2: Manual deployment

1. Deploy the contract:
```sh
forge script script/DeploySmartTourVault.s.sol:DeploySmartTourVault --rpc-url sepolia --broadcast
```

2. Verify the contract (replace CONTRACT_ADDRESS with your deployed contract address):
```sh
forge verify-contract \
    --chain sepolia \
    --compiler-version v0.8.28 \
    --constructor-args $(cast abi-encode "constructor(address,address)" "$USDT_ADDRESS" "$SWAP_ROUTER_ADDRESS") \
    "CONTRACT_ADDRESS" \
    src/SmartTourVault.sol:SmartTourVault
```

## After Deployment

After successful deployment, you'll receive:
1. The deployed contract address
2. A link to the verified contract on Etherscan

You can interact with your contract using the Etherscan interface or by writing scripts.
