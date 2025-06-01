import { create } from 'zustand'
import { blockchainService } from '@/app/services/blockchainService'

export const useWithdrawStore = create((set, get) => ({
  // State
  isLoading: false,
  vaultBalance: null,
  balanceLoading: true,
  withdrawAmount: '',
  error: null,
  success: null,
  isAdminInitialized: false,
  transactionHistory: [],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setBalanceLoading: (loading) => set({ balanceLoading: loading }),
  setVaultBalance: (balance) => set({ vaultBalance: balance }),
  setWithdrawAmount: (amount) => set({ withdrawAmount: amount }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setAdminInitialized: (initialized) => set({ isAdminInitialized: initialized }),
  setTransactionHistory: (history) => set({ transactionHistory: history }),

  // Clear states
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearForm: () => set({ withdrawAmount: '', error: null, success: null }),

  // Initialize admin and fetch balance
  initializeAndFetchBalance: async () => {
    const { setBalanceLoading, setAdminInitialized, setVaultBalance, setError } = get()
    
    try {
      setBalanceLoading(true)
      setError(null)
      
      // Initialize blockchain service
      await blockchainService.initialize()
      
      // Initialize admin
      const adminInit = await blockchainService.initializeAdmin()
      setAdminInitialized(adminInit)
      
      if (adminInit) {
        // Fetch vault balance
        const balance = await blockchainService.getVaultTotalBalance()
        setVaultBalance(balance)
      } else {
        setError("Admin not properly configured. Please check your admin private key in environment variables.")
      }
    } catch (err) {
      console.error("Error initializing:", err)
      setError(`Failed to initialize: ${err.message}`)
    } finally {
      setBalanceLoading(false)
    }
  },

  // Refresh vault balance
  refreshBalance: async () => {
    const { setVaultBalance, setError } = get()
    
    try {
      const balance = await blockchainService.getVaultTotalBalance()
      setVaultBalance(balance)
    } catch (err) {
      console.error("Error refreshing balance:", err)
      setError(`Failed to refresh balance: ${err.message}`)
    }
  },

  // Perform withdrawal
  performWithdraw: async () => {
    const { 
      withdrawAmount, 
      vaultBalance, 
      setLoading, 
      setError, 
      setSuccess, 
      setVaultBalance,
      setTransactionHistory,
      transactionHistory,
      clearForm
    } = get()

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount")
      return false
    }

    if (parseFloat(withdrawAmount) > parseFloat(vaultBalance || 0)) {
      setError("Withdrawal amount exceeds available vault balance")
      return false
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await blockchainService.adminWithdraw(withdrawAmount)
      
      if (result.success) {
        const successData = {
          message: result.message,
          transactionHash: result.transactionHash,
          amount: result.amount
        }
        setSuccess(successData)
        
        // Add to transaction history
        const newTransaction = {
          id: Date.now(),
          type: 'withdrawal',
          amount: result.amount,
          transactionHash: result.transactionHash,
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
        setTransactionHistory([newTransaction, ...transactionHistory])
        
        // Refresh vault balance
        const newBalance = await blockchainService.getVaultTotalBalance()
        setVaultBalance(newBalance)
        
        // Clear form
        clearForm()
        return true
      }
      return false
    } catch (err) {
      console.error("Withdrawal error:", err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  },

  // Set max withdrawal amount
  setMaxAmount: () => {
    const { vaultBalance, setWithdrawAmount } = get()
    if (vaultBalance) {
      setWithdrawAmount(vaultBalance)
    }
  },

  // Validate withdrawal amount
  validateAmount: (amount) => {
    const { vaultBalance } = get()
    
    if (!amount || parseFloat(amount) <= 0) {
      return "Please enter a valid withdrawal amount"
    }
    
    if (parseFloat(amount) > parseFloat(vaultBalance || 0)) {
      return "Withdrawal amount exceeds available vault balance"
    }
    
    return null
  }
}))