const { ethers } = require('ethers');

// Contract ABI (simplified for the functions we need)
const SMART_TOUR_VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function payFromSavings(address user, uint256 amount) external",
  "function adminWithdraw(address token, uint256 amount) external",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event PaymentFromSavings(address indexed user, uint256 amount)"
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
    
    // USDT contract address
    this.usdtAddress = process.env.USDT_ADDRESS;
  }

  // Get user's USDT balance from the vault
  async getUserBalance(userAddress) {
    try {
      if (!this.contract || !this.contractAddress || !userAddress) {
        return 0;
      }
      
      const balance = await this.contract.getUserBalance(userAddress);
      return ethers.formatUnits(balance, 6); // USDT has 6 decimals
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

      const amountInWei = ethers.parseUnits(amount.toString(), 6); // USDT has 6 decimals
      
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

  // Convert TZS to USDT using live exchange rate
  async convertTzsToUsdt(tzsAmount) {
    try {
      // For now, using fixed rate. In production, use live exchange rate API
      const usdtRate = await this.getTzsToUsdRate();
      return tzsAmount / usdtRate;
    } catch (error) {
      console.warn('Using fallback exchange rate:', error.message);
      return tzsAmount / 2500; // Fallback rate
    }
  }

  // Convert USDT to TZS using live exchange rate  
  async convertUsdtToTzs(usdtAmount) {
    try {
      const usdtRate = await this.getTzsToUsdRate();
      return usdtAmount * usdtRate;
    } catch (error) {
      console.warn('Using fallback exchange rate:', error.message);
      return usdtAmount * 2500; // Fallback rate
    }
  }

  // Get live TZS to USD exchange rate
  async getTzsToUsdRate() {
    try {
      // In production, integrate with a real exchange rate API like:
      // - CoinGecko API
      // - Exchange rate API
      // - Bank of Tanzania rates
      
      // For now, return a reasonable rate
      return 2500; // 1 USD = 2500 TZS (approximate)
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 2500; // Fallback rate
    }
  }

  // Check if the blockchain service is properly configured
  isConfigured() {
    return !!(this.contractAddress && 
              this.contractAddress !== '0x1234567890123456789012345678901234567890' &&
              this.provider && 
              this.usdtAddress &&
              this.contract);
  }

  // Check if admin functions are available
  hasAdminAccess() {
    return !!(this.adminWallet && 
              this.contractAddress && 
              this.contractAddress !== '0x1234567890123456789012345678901234567890' &&
              this.contract);
  }
}

module.exports = new BlockchainService();
