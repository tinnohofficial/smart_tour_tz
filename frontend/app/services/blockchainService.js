import { ethers } from 'ethers'

// Contract ABI for Smart Tour Vault
const SMART_TOUR_VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function payFromSavings(address user, uint256 amount) external",
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

    // Contract addresses from environment
    this.contractAddress = process.env.NEXT_PUBLIC_SMART_TOUR_VAULT_ADDRESS
    this.usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS
    this.providerUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_PROVIDER_URL
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

  // Get contract addresses
  getContractAddresses() {
    return {
      vault: this.contractAddress,
      usdc: this.usdcAddress
    }
  }
}

// Export singleton instance
export default new BlockchainService()