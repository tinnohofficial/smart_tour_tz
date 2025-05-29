import { ethers } from 'ethers'

// Contract ABI for Smart Tour Vault
const SMART_TOUR_VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function getUserBalance(address user) external view returns (uint256)",
  "function payFromSavings(address user, uint256 amount) external",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
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
    this.usdtContract = null
    this.connected = false

    // Contract addresses from environment
    this.contractAddress = process.env.NEXT_PUBLIC_SMART_TOUR_VAULT_ADDRESS
    this.usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS
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

        if (this.usdtAddress) {
          this.usdtContract = new ethers.Contract(
            this.usdtAddress,
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
      if (this.usdtContract) {
        this.usdtContract = this.usdtContract.connect(this.signer)
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
    if (this.usdtContract) {
      this.usdtContract = new ethers.Contract(
        this.usdtAddress,
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
      return ethers.formatUnits(balance, 6) // USDT has 6 decimals
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

      const balances = { eth: '0', usdt: '0' }

      // Get ETH balance
      if (this.provider) {
        const ethBalance = await this.provider.getBalance(userAddress)
        balances.eth = ethers.formatEther(ethBalance)
      }

      // Get USDT balance
      if (this.usdtContract) {
        try {
          const usdtBalance = await this.usdtContract.balanceOf(userAddress)
          balances.usdt = ethers.formatUnits(usdtBalance, 6)
        } catch (error) {
          console.warn('Could not fetch USDT balance:', error.message)
        }
      }

      return balances
    } catch (error) {
      console.error('Error getting wallet balances:', error)
      return { eth: '0', usdt: '0' }
    }
  }

  // Deposit USDT to vault
  async depositToVault(usdtAmount) {
    try {
      if (!this.connected || !this.signer || !this.contract || !this.usdtContract) {
        throw new Error('Wallet not connected or contracts not initialized')
      }

      const userAddress = await this.signer.getAddress()
      const amountWei = ethers.parseUnits(usdtAmount.toString(), 6)

      // Check USDT balance
      const usdtBalance = await this.usdtContract.balanceOf(userAddress)
      if (usdtBalance < amountWei) {
        throw new Error('Insufficient USDT balance')
      }

      // Check allowance
      const allowance = await this.usdtContract.allowance(userAddress, this.contractAddress)
      if (allowance < amountWei) {
        // Approve USDT spending
        const approveTx = await this.usdtContract.approve(this.contractAddress, amountWei)
        await approveTx.wait()
      }

      // Deposit to vault
      const depositTx = await this.contract.deposit(this.usdtAddress, amountWei)
      const receipt = await depositTx.wait()

      return {
        success: true,
        transactionHash: receipt.hash,
        amount: usdtAmount
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
          const
 now = new Date()
          
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
        usdtAddress: this.usdtAddress
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
      usdt: this.usdtAddress
    }
  }
}

// Export singleton instance
export default new BlockchainService()