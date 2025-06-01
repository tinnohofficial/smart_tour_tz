const { ethers } = require('ethers');
const exchangeRateService = require('./exchangeRateService');

// Contract ABI (simplified for the functions we need)
const SMART_TOUR_VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function payFromSavings(address user, uint256 amount) external",
  "function adminWithdraw(uint256 amount) external",
  "event Deposit(address indexed user, uint256 amount)",
  "event PaymentFromSavings(address indexed user, uint256 amount)"
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

class BlockchainService {
  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.BLOCKCHAIN_PROVIDER_URL || 'https://polygon-rpc.com'
    );
    
    // Contract address (should be set in environment)
    this.contractAddress = process.env.SMART_TOUR_VAULT_ADDRESS;
    
    // Only initialize contract if we have a valid address
    if (this.contractAddress && this.contractAddress !== '0x1234567890123456789012345678901234567890') {
      // Admin wallet for contract interactions
      if (process.env.ADMIN_PRIVATE_KEY && process.env.ADMIN_PRIVATE_KEY !== '0xplaceholder_add_your_admin_private_key_here') {
        this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(
          this.contractAddress,
          SMART_TOUR_VAULT_ABI,
          this.adminWallet
        );
      } else {
        // Read-only contract instance
        this.contract = new ethers.Contract(
          this.contractAddress,
          SMART_TOUR_VAULT_ABI,
          this.provider
        );
      }
    } else {
      this.contract = null;
      this.adminWallet = null;
    }
    
    // USDC contract address and contract instance
    this.usdcAddress = process.env.USDC_ADDRESS;
    if (this.usdcAddress && this.provider) {
      this.usdcContract = new ethers.Contract(this.usdcAddress, ERC20_ABI, this.provider);
    }
  }

  // Get user's USDC balance from the vault
  async getUserBalance(userAddress) {
    try {
      if (!this.contract || !this.contractAddress || !userAddress) {
        return 0;
      }
      
      const balance = await this.contract.getUserBalance(userAddress);
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }

  // Process payment from user's savings (only admin can call this)
  async payFromSavings(userAddress, amount) {
    try {
      if (!this.adminWallet || !this.contract) {
        throw new Error('Admin wallet or contract not configured');
      }

      const amountInWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
      
      const tx = await this.contract.payFromSavings(userAddress, amountInWei);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error processing payment from savings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listen for deposit events
  async checkRecentDeposits(userAddress, expectedAmount, timeWindow = 300000) { // 5 minutes
    try {
      if (!this.contract || !this.provider) {
        return { found: false, error: 'Contract not configured' };
      }
      
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 100; // Check last 100 blocks
      
      const filter = this.contract.filters.Deposit(userAddress);
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);
      
      const recentEvents = events.filter(event => {
        const eventTime = new Date(event.block.timestamp * 1000);
        const now = new Date();
        return (now - eventTime) <= timeWindow;
      });

      for (const event of recentEvents) {
        const depositAmount = ethers.formatUnits(event.args.amount, 6);
        if (Math.abs(parseFloat(depositAmount) - expectedAmount) < 0.01) { // Allow small tolerance
          return {
            found: true,
            transactionHash: event.transactionHash,
            amount: depositAmount
          };
        }
      }

      return { found: false };
    } catch (error) {
      console.error('Error checking recent deposits:', error);
      return { found: false, error: error.message };
    }
  }

  // Convert TZS to USDC using live exchange rate
  async convertTzsToUsdc(tzsAmount) {
    try {
      return await exchangeRateService.convertTzsToUsdc(tzsAmount);
    } catch (error) {
      console.warn('Error converting TZS to USDC:', error.message);
      return tzsAmount / 2500; // Fallback rate
    }
  }

  // Convert USDC to TZS using live exchange rate  
  async convertUsdcToTzs(usdcAmount) {
    try {
      return await exchangeRateService.convertUsdcToTzs(usdcAmount);
    } catch (error) {
      console.warn('Error converting USDC to TZS:', error.message);
      return usdcAmount * 2500; // Fallback rate
    }
  }

  // Get conversion rates for a TZS amount
  async getConversionRates(tzsAmount) {
    try {
      return await exchangeRateService.getConversionRates(tzsAmount);
    } catch (error) {
      console.warn('Error getting conversion rates:', error.message);
      const usdAmount = tzsAmount / 2500;
      return {
        tzs: tzsAmount,
        usd: usdAmount,
        usdc: usdAmount,
        rates: { USD_TZS: 2500, USD_USDC: 1.0 }
      };
    }
  }

  // Get user's wallet token balance (ETH, USDC, etc.)
  async getWalletTokenBalance(userAddress, tokenAddress = null) {
    try {
      if (!this.provider || !userAddress) {
        return { eth: 0, usdc: 0 };
      }

      // Get ETH balance
      const ethBalance = await this.provider.getBalance(userAddress);
      const ethFormatted = ethers.formatEther(ethBalance);

      // Get USDC balance
      let usdcFormatted = 0;
      if (this.usdcContract && (tokenAddress === this.usdcAddress || !tokenAddress)) {
        try {
          const usdcBalance = await this.usdcContract.balanceOf(userAddress);
          usdcFormatted = ethers.formatUnits(usdcBalance, 6); // USDC has 6 decimals
        } catch (error) {
          console.warn('Could not fetch USDC balance:', error.message);
        }
      }

      return {
        eth: parseFloat(ethFormatted),
        usdc: parseFloat(usdcFormatted),
        address: userAddress
      };
    } catch (error) {
      console.error('Error getting wallet token balance:', error);
      return { eth: 0, usdc: 0, address: userAddress };
    }
  }

  // Check if user has sufficient balance for a transaction
  async checkSufficientBalance(userAddress, requiredUsdcAmount) {
    try {
      const vaultBalance = await this.getUserBalance(userAddress);
      const walletBalance = await this.getWalletTokenBalance(userAddress);
      
      return {
        vaultBalance: parseFloat(vaultBalance),
        walletBalance: walletBalance.usdc,
        totalBalance: parseFloat(vaultBalance) + walletBalance.usdc,
        sufficient: (parseFloat(vaultBalance) + walletBalance.usdc) >= requiredUsdcAmount,
        requiredAmount: requiredUsdcAmount
      };
    } catch (error) {
      console.error('Error checking sufficient balance:', error);
      return {
        vaultBalance: 0,
        walletBalance: 0,
        totalBalance: 0,
        sufficient: false,
        requiredAmount: requiredUsdcAmount
      };
    }
  }

  // Listen for deposit events
  async checkRecentDeposits(userAddress, expectedAmount, timeWindow = 300000) { // 5 minutes
    try {
      if (!this.contract || !this.provider) {
        return { found: false, error: 'Contract not configured' };
      }
      
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = currentBlock - 100; // Check last 100 blocks
      
      const filter = this.contract.filters.Deposit(userAddress);
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);
      
      const recentEvents = events.filter(event => {
        const eventTime = new Date(event.block.timestamp * 1000);
        const now = new Date();
        return (now - eventTime) <= timeWindow;
      });

      for (const event of recentEvents) {
        const depositAmount = ethers.formatUnits(event.args.amount, 6);
        if (Math.abs(parseFloat(depositAmount) - expectedAmount) < 0.01) { // Allow small tolerance
          return {
            found: true,
            transactionHash: event.transactionHash,
            amount: depositAmount
          };
        }
      }

      return { found: false };
    } catch (error) {
      console.error('Error checking recent deposits:', error);
      return { found: false, error: error.message };
    }
  }

  // Check if the blockchain service is properly configured
  isConfigured() {
    return !!(this.contractAddress && 
              this.contractAddress !== '0x1234567890123456789012345678901234567890' &&
              this.provider && 
              this.usdcAddress &&
              this.contract);
  }

  // Check if admin functions are available
  hasAdminAccess() {
    return !!(this.adminWallet && 
              this.contractAddress && 
              this.contractAddress !== '0x1234567890123456789012345678901234567890' &&
              this.contract);
  }

  // Get network information
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        return { connected: false, error: 'Provider not configured' };
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        connected: true,
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber: blockNumber,
        contractAddress: this.contractAddress,
        usdcAddress: this.usdcAddress,
        hasAdminAccess: this.hasAdminAccess()
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return { connected: false, error: error.message };
    }
  }

  // Process automatic payment from savings with enhanced error handling
  async processAutomaticPayment(userAddress, tzsAmount) {
    try {
      if (!this.hasAdminAccess()) {
        throw new Error('Admin access not configured for automatic payments');
      }

      // Convert TZS to USDC
      const usdcAmount = await this.convertTzsToUsdc(tzsAmount);
      
      // Check if user has sufficient balance
      const balanceCheck = await this.checkSufficientBalance(userAddress, usdcAmount);
      if (!balanceCheck.sufficient) {
        return {
          success: false,
          error: 'Insufficient vault balance',
          required: usdcAmount,
          available: balanceCheck.vaultBalance
        };
      }

      // Execute the payment
      const result = await this.payFromSavings(userAddress, usdcAmount);
      
      if (result.success) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed,
          amountUSDC: usdcAmount,
          amountTZS: tzsAmount,
          exchangeRate: tzsAmount / usdcAmount
        };
      } else {
        return {
          success: false,
          error: result.error || 'Payment transaction failed'
        };
      }
    } catch (error) {
      console.error('Error processing automatic payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = new BlockchainService();