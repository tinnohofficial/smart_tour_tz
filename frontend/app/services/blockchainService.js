import { ethers } from 'ethers'

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
    this.tzcContract = null
    this.connected = false
    this.adminWallet = null

    // Contract addresses from environment
    this.contractAddress = process.env.NEXT_PUBLIC_SMART_TOUR_VAULT_ADDRESS
    this.tzcAddress = process.env.NEXT_PUBLIC_TZC_ADDRESS
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

        if (this.tzcAddress) {
          this.tzcContract = new ethers.Contract(
            this.tzcAddress,
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
      if (this.tzcContract) {
        this.tzcContract = this.tzcContract.connect(this.signer)
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
    if (this.tzcContract) {
      this.tzcContract = new ethers.Contract(
        this.tzcAddress,
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
      return ethers.formatUnits(balance, 18) // TZC has 18 decimals
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

      const balances = { eth: '0', tzc: '0' }

      // Get ETH balance
      if (this.provider) {
        const ethBalance = await this.provider.getBalance(userAddress)
        balances.eth = ethers.formatEther(ethBalance)
      }

      // Get TZC balance
      if (this.tzcContract) {
        try {
          const tzcBalance = await this.tzcContract.balanceOf(userAddress)
          balances.tzc = ethers.formatUnits(tzcBalance, 18)
        } catch (error) {
          console.warn('Could not fetch TZC balance:', error.message)
        }
      }

      return balances
    } catch (error) {
      console.error('Error getting wallet balances:', error)
      return { eth: '0', tzc: '0' }
    }
  }

  // Deposit TZC to vault
  async depositToVault(tzcAmount) {
    try {
      if (!this.connected || !this.signer || !this.contract || !this.tzcContract) {
        throw new Error('Wallet not connected or contracts not initialized')
      }

      const userAddress = await this.signer.getAddress()
      const amountWei = ethers.parseUnits(tzcAmount.toString(), 18)

      // Check TZC balance
      const tzcBalance = await this.tzcContract.balanceOf(userAddress)
      if (tzcBalance < amountWei) {
        throw new Error('Insufficient TZC balance')
      }

      // Check allowance
      const allowance = await this.tzcContract.allowance(userAddress, this.contractAddress)
      if (allowance < amountWei) {
        // Approve TZC spending
        const approveTx = await this.tzcContract.approve(this.contractAddress, amountWei)
        await approveTx.wait()
      }

      // Deposit to vault
      const depositTx = await this.contract.deposit(amountWei)
      const receipt = await depositTx.wait()

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: tzcAmount
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
        tzcAddress: this.tzcAddress
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

  // Convert TZS to TZC (1:1 ratio)
  async convertTzsToTzc(tzsAmount) {
    return tzsAmount // 1 TZS = 1 TZC
  }

  // Convert TZC to TZS (1:1 ratio)
  async convertTzcToTzs(tzcAmount) {
    return tzcAmount // 1 TZC = 1 TZS
  }

  // Get conversion rates for a TZS amount
  async getConversionRates(tzsAmount) {
    return {
      tzs: tzsAmount,
      tzc: tzsAmount, // 1 TZS = 1 TZC
      rates: { 
        TZS_TZC: 1.0 
      }
    }
  }

  // Process payment from user's vault balance
  async payFromVault(userAddress, tzsAmount) {
    try {
      if (!this.connected || !this.signer || !this.contract) {
        throw new Error('Wallet not connected or contracts not initialized')
      }

      // Convert TZS to TZC (1:1 ratio)
      const tzcAmount = await this.convertTzsToTzc(tzsAmount)
      
      // Check if user has sufficient vault balance
      const vaultBalance = await this.getUserVaultBalance(userAddress)
      if (parseFloat(vaultBalance) < tzcAmount) {
        throw new Error(`Insufficient vault balance. Required: ${tzcAmount} TZC, Available: ${vaultBalance} TZC`)
      }

      const amountWei = ethers.parseUnits(tzcAmount.toString(), 18)

      // Execute payment from vault
      const tx = await this.contract.payFromSavings(userAddress, amountWei)
      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: receipt.hash,
        amountTZC: tzcAmount,
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
      const requiredTzcAmount = await this.convertTzsToTzc(requiredTzsAmount)
      
      return {
        vaultBalance: parseFloat(vaultBalance),
        walletBalance: parseFloat(walletBalances.tzc),
        totalBalance: parseFloat(vaultBalance) + parseFloat(walletBalances.tzc),
        sufficient: (parseFloat(vaultBalance) + parseFloat(walletBalances.tzc)) >= requiredTzcAmount,
        requiredAmount: requiredTzcAmount,
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
              amountTZC: result.amountTZC,
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
              amountTZC: result.amountTZC,
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
      tzc: this.tzcAddress
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