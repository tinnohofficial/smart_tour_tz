#!/usr/bin/env bash

# Script to deploy and verify SmartTourVault contract on Sepolia testnet

# Load environment variables
source .env

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Deploy the contract
echo -e "${YELLOW}Deploying SmartTourVault contract to Sepolia...${NC}"
DEPLOYED_ADDRESS=$(forge script ./DeploySmartTourVault.s.sol:DeploySmartTourVault --rpc-url sepolia --broadcast --verify -vvvv | grep -oE '0x[a-fA-F0-9]{40}' | tail -1)

if [ -z "$DEPLOYED_ADDRESS" ]; then
    echo "Failed to extract deployed contract address. Check the forge output."
    exit 1
fi

echo -e "${GREEN}Contract deployed at: $DEPLOYED_ADDRESS${NC}"

# Step 2: Verify the contract
echo -e "${YELLOW}Verifying contract on Etherscan...${NC}"
forge verify-contract \
    --chain sepolia \
    --compiler-version v0.8.28 \
    --constructor-args $(cast abi-encode "constructor(address,address)" "$USDT_ADDRESS" "$SWAP_ROUTER_ADDRESS") \
    "$DEPLOYED_ADDRESS" \
    src/SmartTourVault.sol:SmartTourVault

echo -e "${GREEN}Deployment and verification process completed!${NC}"
