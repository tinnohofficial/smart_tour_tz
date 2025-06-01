import { ethers } from 'ethers'
import exchangeRate from '../utils/exchangeRate'

// Contract ABI for Smart Tour Vault
const SMART_TOUR_VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function payFromSavings(address user, uint256 amount) external",
  "function adminWithdraw(uint256 amount) external",
  "event Deposit(address indexed user, uint256 amount)",
  "event PaymentFromSavings(address indexed user, uint256 amount)"
]

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
]

class BlockchainService {
  constructor() {
    this.provider = null
    this.signer = null
    this.contract = null
    this.usdcContract = null
    this.connected = false
    this.adminWallet = null

    // Contract addresses from environment
    this.contractAddress = process.env.NEXT_PUBLIC_SMART_TOUR_VAULT_ADDRESS
    this.usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS
    this.providerUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER_URL
    
    // Admin private key for server-side operations (only use in secure contexts)
    this.adminPrivateKey = process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY
  }

  // Initialize the service
  async initialize() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)

        if (this.contractAddress) {
          this.contract = new ethers.Contract(
            this.contractAddress,
            SMART_TOUR_VAULT_ABI,
            this.provider
          )
        }

        if (this.usdcAddress) {
          this.usdcContract = new ethers.Contract(
            this.usdcAddress,
            ERC20_ABI,
            this.provider
          )
        }

        return true
      }
      return false
    } catch (error) {
      console.error('Error initializing blockchain service:', error)
      return false
    }
  }

  // Connect to MetaMask wallet
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      await this.initialize()

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      this.signer = await this.provider.getSigner()
      const address = await this.signer.getAddress()
      this.connected = true

      // Update contract instances with signer
      if (this.contract) {
        this.contract = this.contract.connect(this.signer)
      }
      if (this.usdcContract) {
        this.usdcContract = this.usdcContract.connect(this.signer)
      }

      // Get network info
      const network = await this.provider.getNetwork()

      return {
        success: true,
        address: address,
        chainId: network.chainId.toString(),
        networkName: network.name
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Disconnect wallet
  disconnect() {
    this.signer = null
    this.connected = false
    if (this.contract) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        SMART_TOUR_VAULT_ABI,
        this.provider
      )
    }
    if (this.usdcContract) {
      this.usdcContract = new ethers.Contract(
        this.usdcAddress,
        ERC20_ABI,
        this.provider
      )
    }
  }

  // Get current connected address
  async getConnectedAddress() {
    try {
      if (!this.connected || !this.signer) {
        return null
      }
      return await this.signer.getAddress()
    } catch (error) {
      console.error('Error getting connected address:', error)
      return null
    }
  }

  // Get user's vault balance
  async getUserVaultBalance(address = null) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized')
      }

      const userAddress = address || await this.getConnectedAddress()
      if (!userAddress) {
        throw new Error('No wallet connected')
      }

      const balance = await this.contract.getUserBalance(userAddress)
      return ethers.formatUnits(balance, 6) // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting vault balance:', error)
      return '0'
    }
  }

  // Get user's wallet token balances
  async getWalletBalances(address = null) {
    try {
      const userAddress = address || await this.getConnectedAddress()
      if (!userAddress) {
        throw new Error('No wallet connected')
      }

      const balances = { eth: '0', usdc: '0' }

      // Get ETH balance
      if (this.provider) {
        const ethBalance = await this.provider.getBalance(userAddress)
        balances.eth = ethers.formatEther(ethBalance)
      }

      // Get USDC balance
      if (this.usdcContract) {
        try {
          const usdcBalance = await this.usdcContract.balanceOf(userAddress)
          balances.usdc = ethers.formatUnits(usdcBalance, 6)
        } catch (error) {
          console.warn('Could not fetch USDC balance:', error.message)
        }
      }

      return balances
    } catch (error) {
      console.error('Error getting wallet balances:', error)
      return { eth: '0', usdc: '0' }
    }
  }

  // Deposit USDC to vault
  async depositToVault(usdcAmount) {
    try {
      if (!this.connected || !this.signer || !this.contract || !this.usdcContract) {
        throw new Error('Wallet not connected or contracts not initialized')
      }

      const userAddress = await this.signer.getAddress()
      const amountWei = ethers.parseUnits(usdcAmount.toString(), 6)

      // Check USDC balance
      const usdcBalance = await this.usdcContract.balanceOf(userAddress)
      if (usdcBalance < amountWei) {
        throw new Error('Insufficient USDC balance')
      }

      // Check allowance
      const allowance = await this.usdcContract.allowance(userAddress, this.contractAddress)
      if (allowance < amountWei) {
        // Approve USDC spending
        const approveTx = await this.usdcContract.approve(this.contractAddress, amountWei)
        await approveTx.wait()
      }

      // Deposit to vault
      const depositTx = await this.contract.deposit(amountWei)
      const receipt = await depositTx.wait()

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: usdcAmount
      }
    } catch (error) {
      console.error('Error depositing to vault:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Listen for deposit events
  async checkRecentDeposits(userAddress, expectedAmount, timeWindow = 300000) {
    try {
      if (!this.contract || !this.provider) {
        return { found: false, error: 'Contract not configured' }
      }

      const currentBlock = await this.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 100) // Check last 100 blocks

      const filter = this.contract.filters.Deposit(userAddress)
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock)

      // Filter recent events
      const recentEvents = []
      for (const event of events) {
        try {
          const block = await this.provider.getBlock(event.blockNumber)
          const eventTime = new Date(block.timestamp * 1000)
          const now = new Date()
          
          if ((now - eventTime) <= timeWindow) {
            recentEvents.push({
              ...event,
              timestamp: eventTime
            })
          }
        } catch (error) {
          console.warn('Error getting block info for event:', error)
        }
      }

      // Check for matching amounts
      for (const event of recentEvents) {
        const depositAmount = ethers.formatUnits(event.args.amount, 6)
        if (Math.abs(parseFloat(depositAmount) - expectedAmount) < 0.01) {
          return {
            found: true,
            transactionHash: event.transactionHash,
            amount: depositAmount,
            timestamp: event.timestamp
          }
        }
      }

      return { found: false }
    } catch (error) {
      console.error('Error checking recent deposits:', error)
      return { found: false, error: error.message }
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        return { connected: false, error: 'Provider not initialized' }
      }
      
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      
      return {
        connected: true,
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber: blockNumber,
        contractAddress: this.contractAddress,
        usdcAddress: this.usdcAddress
      }
    } catch (error) {
      console.error('Error getting network info:', error)
      return { connected: false, error: error.message }
    }
  }

  // Switch to correct network (Mumbai testnet)
  async switchToMumbai() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // Mumbai testnet
      })
      
      return { success: true }
    } catch (error) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13881',
              chainName: 'Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/']
            }]
          })
          return { success: true }
        } catch (addError) {
          return { success: false, error: addError.message }
        }
      }
      
      return { success: false, error: error.message }
    }
  }

  // Check if wallet is connected
  isConnected() {
    return this.connected && this.signer !== null
  }

  // Convert TZS to USDC using live exchange rate
  async convertTzsToUsdc(tzsAmount) {
    try {
      return await exchangeRate.convertTzsToUsdc(tzsAmount)
    } catch (error) {
      console.warn('Error converting TZS to USDC:', error.message)
      return tzsAmount / 2500 // Fallback rate
    }
  }

  // Convert USDC to TZS using live exchange rate
  async convertUsdcToTzs(usdcAmount) {
    try {
      return await exchangeRate.convertUsdcToTzs(usdcAmount)
    } catch (error) {
      console.warn('Error converting USDC to TZS:', error.message)
      return usdcAmount * 2500 // Fallback rate
    }
  }

  // Get conversion rates for a TZS amount
  async getConversionRates(tzsAmount) {
    try {
      const usdToTzsRate = await exchangeRate.getUsdToTzsRate()
      const usdAmount = tzsAmount / usdToTzsRate
      
      return {
        tzs: tzsAmount,
        usd: usdAmount,
        usdc: usdAmount, // Since 1 USDC = 1 USD
        rates: { 
          USD_TZS: usdToTzsRate, 
          USD_USDC: 1.0 
        }
      }
    } catch (error) {
      console.warn('Error getting conversion rates:', error.message)
      const usdAmount = tzsAmount / 2500
      
      return {
        tzs: tzsAmount,
        usd: usdAmount,
        usdc: usdAmount,
        rates: { 
          USD_TZS: 2500, 
          USD_USDC: 1.0 
        }
      }
    }
  }

  // Process payment from user's vault balance
  async payFromVault(userAddress, tzsAmount) {
    try {
      if (!this.connected || !this.signer || !this.contract) {
        throw new Error('Wallet not connected or contracts not initialized')
      }

      // Convert TZS to USDC
      const usdcAmount = await this.convertTzsToUsdc(tzsAmount)
      
      // Check if user has sufficient vault balance
      const vaultBalance = await this.getUserVaultBalance(userAddress)
      if (parseFloat(vaultBalance) < usdcAmount) {
        throw new Error(`Insufficient vault balance. Required: ${usdcAmount} USDC, Available: ${vaultBalance} USDC`)
      }

      const amountWei = ethers.parseUnits(usdcAmount.toString(), 6)

      // Execute payment from vault
      const tx = await this.contract.payFromSavings(userAddress, amountWei)
      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: receipt.hash,
        amountUSDC: usdcAmount,
        amountTZS: tzsAmount,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('Error processing payment from vault:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Check if user has sufficient balance for a transaction
  async checkSufficientBalance(userAddress, requiredTzsAmount) {
    try {
      const vaultBalance = await this.getUserVaultBalance(userAddress)
      const walletBalances = await this.getWalletBalances(userAddress)
      const requiredUsdcAmount = await this.convertTzsToUsdc(requiredTzsAmount)
      
      return {
        vaultBalance: parseFloat(vaultBalance),
        walletBalance: parseFloat(walletBalances.usdc),
        totalBalance: parseFloat(vaultBalance) + parseFloat(walletBalances.usdc),
        sufficient: (parseFloat(vaultBalance) + parseFloat(walletBalances.usdc)) >= requiredUsdcAmount,
        requiredAmount: requiredUsdcAmount,
        requiredTzs: requiredTzsAmount
      }
    } catch (error) {
      console.error('Error checking sufficient balance:', error)
      return {
        vaultBalance: 0,
        walletBalance: 0,
        totalBalance: 0,
        sufficient: false,
        requiredAmount: 0,
        requiredTzs: requiredTzsAmount
      }
    }
  }

  // Process crypto payment for booking
  async processCryptoPayment(bookingId, tzsAmount, paymentMethod = 'vault') {
    try {
      if (!this.connected || !this.signer) {
        throw new Error('Wallet not connected')
      }

      const userAddress = await this.signer.getAddress()
      
      if (paymentMethod === 'vault') {
        // Pay from vault balance
        const result = await this.payFromVault(userAddress, tzsAmount)
        
        if (result.success) {
          // Call backend to confirm payment
          const response = await fetch(`/api/bookings/${bookingId}/pay`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentMethod: 'crypto',
              walletAddress: userAddress,
              transactionHash: result.transactionHash,
              useVaultBalance: true,
              amountUSDC: result.amountUSDC,
              amountTZS: result.amountTZS
            })
          })

          if (!response.ok) {
            throw new Error('Failed to confirm payment with backend')
          }

          return {
            success: true,
            transactionHash: result.transactionHash,
            paymentMethod: 'crypto-vault'
          }
        } else {
          throw new Error(result.error)
        }
      } else {
        // Direct wallet payment (simplified)
        const response = await fetch(`/api/bookings/${bookingId}/pay`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentMethod: 'crypto',
            walletAddress: userAddress,
            useVaultBalance: false
          })
        })

        if (!response.ok) {
          throw new Error('Failed to process crypto payment')
        }

        return {
          success: true,
          paymentMethod: 'crypto-direct'
        }
      }
    } catch (error) {
      console.error('Error processing crypto payment:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Process cart checkout with crypto
  async processCryptoCartCheckout(cartId, totalTzsAmount, paymentMethod = 'vault') {
    try {
      if (!this.connected || !this.signer) {
        throw new Error('Wallet not connected')
      }

      const userAddress = await this.signer.getAddress()
      
      if (paymentMethod === 'vault') {
        // Pay from vault balance
        const result = await this.payFromVault(userAddress, totalTzsAmount)
        
        if (result.success) {
          // Call backend to confirm payment
          const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentMethod: 'crypto',
              walletAddress: userAddress,
              transactionHash: result.transactionHash,
              useVaultBalance: true,
              amountUSDC: result.amountUSDC,
              amountTZS: result.amountTZS
            })
          })

          if (!response.ok) {
            throw new Error('Failed to confirm cart checkout with backend')
          }

          return {
            success: true,
            transactionHash: result.transactionHash,
            paymentMethod: 'crypto-vault'
          }
        } else {
          throw new Error(result.error)
        }
      } else {
        // Direct wallet payment (simplified)
        const response = await fetch('/api/cart/checkout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentMethod: 'crypto',
            walletAddress: userAddress,
            useVaultBalance: false
          })
        })

        if (!response.ok) {
          throw new Error('Failed to process crypto cart checkout')
        }

        return {
          success: true,
          paymentMethod: 'crypto-direct'
        }
      }
    } catch (error) {
      console.error('Error processing crypto cart checkout:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get contract addresses
  getContractAddresses() {
    return {
      vault: this.contractAddress,
      usdc: this.usdcAddress
    }
  }

  // Initialize admin functions (for server-side operations)
  async initializeAdmin() {
    try {
      if (!this.adminPrivateKey || this.adminPrivateKey === 'your_admin_private_key_here') {
        return false
      }

      // Create a JsonRpcProvider for admin operations
      const adminProvider = new ethers.JsonRpcProvider(
        this.providerUrl || 'https://polygon-rpc.com'
      )

      this.adminWallet = new ethers.Wallet(this.adminPrivateKey, adminProvider)
      
      if (this.contractAddress) {
        this.adminContract = new ethers.Contract(
          this.contractAddress,
          SMART_TOUR_VAULT_ABI,
          this.adminWallet
        )
      }

      return true
    } catch (error) {
      console.error('Error initializing admin functions:', error)
      return false
    }
  }
}

// Export singleton instance
export default new BlockchainService()