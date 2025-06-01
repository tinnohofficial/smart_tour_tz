# USDC to TZC Migration Summary

## Overview
Successfully migrated the Smart Tour Tanzania system from using USDC (USD Coin) to TZC (Tanzania Shilling Coin), a custom ERC20 token. This change simplifies the system by eliminating exchange rate conversions since TZC has a 1:1 relationship with TZS (Tanzania Shilling).

## Key Changes Made

### 1. Blockchain Contracts

#### New TZC Token Contract
- **File**: `fyp/blockchain/src/TanzaniaShillingCoin.sol`
- **Features**:
  - ERC20 compliant token
  - Name: "Tanzania Shilling Coin"
  - Symbol: "TZC"
  - Decimals: 18 (standard ERC20)
  - Initial supply: 1 billion TZC
  - Mintable by owner
  - Burnable by token holders

#### Updated Vault Contract
- **File**: `fyp/blockchain/src/SmartTourVault.sol`
- **Changes**:
  - Replaced `usdcToken` with `tzcToken`
  - Updated all USDC references to TZC
  - Changed decimal handling from 6 to 18 decimals
  - Updated constructor to accept TZC token address

#### Deployment Script
- **File**: `fyp/blockchain/script/Deploy.s.sol`
- Automated deployment of both TZC token and updated vault contract

#### Test Suite
- **File**: `fyp/blockchain/test/TanzaniaShillingCoin.t.sol`
- Comprehensive tests for TZC token and vault integration

### 2. Frontend Changes

#### Removed Exchange Rate System
- **Deleted**: `fyp/frontend/app/utils/exchangeRate.js`
- **Reason**: No longer needed since 1 TZS = 1 TZC

#### Updated Blockchain Service
- **File**: `fyp/frontend/app/services/blockchainService.js`
- **Changes**:
  - Replaced `usdcContract` with `tzcContract`
  - Updated contract addresses from USDC to TZC
  - Simplified conversion methods (1:1 ratio)
  - Updated decimal handling (6 → 18 decimals)
  - Removed exchange rate dependencies

#### Updated Savings Store
- **File**: `fyp/frontend/app/savings/savingStore.js`
- **Changes**:
  - Removed exchange rate imports and conversions
  - Direct TZS to TZC mapping (1:1)

#### Updated Savings Page
- **File**: `fyp/frontend/app/savings/page.js`
- **Changes**:
  - Removed USDC amount preview section
  - Eliminated exchange rate calculations
  - Updated UI text from USDC to TZC
  - Simplified deposit flow

#### Updated Booking Page
- **File**: `fyp/frontend/app/book/[id]/page.js`
- **Changes**:
  - Updated payment method text from USDC to TZC
  - Removed USDC amount calculations
  - Updated alert messages

### 3. Backend Changes

#### Updated Controllers
- **Files**: 
  - `fyp/backend/controllers/bookingsController.js`
  - `fyp/backend/controllers/cartController.js`
- **Changes**:
  - Replaced `amountUSDC` with `amountTZC` in request handling
  - Updated payment processing logic

### 4. Environment Configuration

#### Updated Environment Variables
- **Files**: 
  - `fyp/backend/.env.example`
  - `fyp/frontend/.env.example`
- **Changes**:
  - Replaced `USDC_ADDRESS` with `TZC_ADDRESS`
  - Updated comments and documentation

## Benefits of Migration

### 1. Simplified Architecture
- **Before**: TZS → USD → USDC (complex multi-step conversion)
- **After**: TZS → TZC (direct 1:1 mapping)

### 2. Reduced Complexity
- Eliminated exchange rate API dependencies
- Removed conversion calculations throughout the codebase
- Simplified error handling

### 3. Better User Experience
- No confusing USDC amount previews
- Direct TZS amounts throughout the UI
- Faster transactions (no rate lookups)

### 4. Full Control
- Custom token tailored for Tanzania market
- No dependency on external USDC contract
- Ability to mint/burn as needed

## Technical Specifications

### TZC Token Details
- **Contract Type**: ERC20
- **Name**: Tanzania Shilling Coin
- **Symbol**: TZC
- **Decimals**: 18
- **Initial Supply**: 1,000,000,000 TZC
- **Features**: Mintable, Burnable, Owned

### Exchange Rate
- **TZS to TZC**: 1:1 (fixed)
- **TZC to TZS**: 1:1 (fixed)
- **No external API calls required**

## Deployment Steps

1. Deploy TZC token contract
2. Deploy updated SmartTourVault with TZC address
3. Update environment variables in both frontend and backend
4. Update any existing user balances (if needed)

## Testing

Comprehensive test suite included covering:
- Token minting and burning
- Vault deposits and withdrawals
- Payment processing
- Access control
- Edge cases and error conditions

## Migration Impact

### Existing Users
- Vault balances will need to be migrated from USDC to TZC
- No change in value (1 USDC worth of value = equivalent TZC)

### System Operations
- Simplified payment processing
- Reduced API calls and external dependencies
- Improved reliability and performance

This migration successfully transforms the Smart Tour Tanzania system to use a native Tanzania Shilling Coin, providing better alignment with the local market while significantly simplifying the technical architecture.