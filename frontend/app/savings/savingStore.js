import { create } from "zustand";
import blockchainService from '../services/blockchainService';

const useSavingsStore = create((set, get) => ({
  balance: 0, // Total balance (fiat + crypto in TZS)
  blockchainBalance: 0, // Crypto balance in TZS
  walletAddress: null,
  walletTokenBalance: { eth: 0, usdt: 0 }, // Live wallet token balances
  conversionRates: null, // Live conversion rates
  savingDuration: 30, // Saving duration in days
  depositAmount: "",
  isDepositing: false,
  isBalanceVisible: false,
  isWalletConnected: false,
  isConnectingWallet: false,
  targetAmount: 13000000, // 13M TZS target
  transactions: [],
  networkInfo: null,

  setBalance: (newBalance) => set({ balance: newBalance }),
  setBlockchainBalance: (blockchainBalance) => set({ blockchainBalance }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletTokenBalance: (balance) => set({ walletTokenBalance: balance }),
  setConversionRates: (rates) => set({ conversionRates: rates }),
  setSavingDuration: (duration) => set({ savingDuration: duration }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setIsWalletConnected: (connected) => set({ isWalletConnected: connected }),
  setIsConnectingWallet: (connecting) => set({ isConnectingWallet: connecting }),
  setTargetAmount: (amount) => set({ targetAmount: amount }),
  setNetworkInfo: (info) => set({ networkInfo: info }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Connect MetaMask wallet with enhanced blockchain service
  connectWallet: async () => {
    set({ isConnectingWallet: true });
    try {
      // Initialize blockchain service
      await blockchainService.initialize();
      
      // Connect to wallet
      const walletResult = await blockchainService.connectWallet();
      
      if (walletResult.success) {
        // Get wallet balances
        const walletBalances = await blockchainService.getWalletBalances();
        const vaultBalance = await blockchainService.getUserVaultBalance();
        
        set({ 
          walletAddress: walletResult.address,
          isWalletConnected: true,
          walletTokenBalance: walletBalances
        });
        
        // Connect wallet with backend
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/savings/connect-wallet', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: walletResult.address })
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              walletTokenBalance: data.walletTokenBalance || walletBalances 
            });
          }
        }
        
        // Fetch updated balance from backend
        await get().fetchBalance();
        
        return { success: true, address: walletResult.address };
      } else {
        throw new Error(walletResult.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isConnectingWallet: false });
    }
  },

  // Disconnect wallet
  disconnectWallet: async () => {
    try {
      // Disconnect from blockchain service
      blockchainService.disconnect();
      
      // Disconnect from backend
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/savings/disconnect-wallet', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      set({ 
        walletAddress: null, 
        isWalletConnected: false,
        blockchainBalance: 0,
        walletTokenBalance: { eth: 0, usdt: 0 }
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Still disconnect locally even if backend call fails
      set({ 
        walletAddress: null, 
        isWalletConnected: false,
        blockchainBalance: 0,
        walletTokenBalance: { eth: 0, usdt: 0 }
      });
    }
  },

  // Fetch balance from backend API
  fetchBalance: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/savings/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ 
          balance: data.balance || 0,
          blockchainBalance: data.blockchainBalance || 0,
          walletAddress: data.walletAddress || null,
          isWalletConnected: Boolean(data.walletAddress),
          walletTokenBalance: data.walletTokenBalance || { eth: 0, usdt: 0 },
          conversionRates: data.conversionRates || null
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Fetch live blockchain balance from smart contract
  fetchLiveBlockchainBalance: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/savings/live-balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ 
          blockchainBalance: data.balance || 0,
          walletAddress: data.walletAddress,
          isWalletConnected: Boolean(data.walletAddress),
          walletTokenBalance: data.walletTokenBalance || { eth: 0, usdt: 0 },
          conversionRates: data.conversionRates || null
        });
        
        // Also refresh total balance
        await get().fetchBalance();
        
        return { success: true, balance: data.balance };
      }
    } catch (error) {
      console.error('Failed to fetch live blockchain balance:', error);
      return { success: false, error: error.message };
    }
  },

  // Deposit funds (both fiat via Stripe and crypto via MetaMask)
  depositFunds: async (amount, method, walletAddress = null) => {
    set({ isDepositing: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const payload = {
        amount: parseFloat(amount),
        method: method,
      };

      // Add wallet address for crypto deposits
      if (method === 'crypto' && walletAddress) {
        payload.walletAddress = walletAddress;
      }

      const response = await fetch('/api/savings/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // For Stripe payments, return client secret
        if (method === 'stripe' && data.clientSecret) {
          return {
            success: true,
            requiresPayment: true,
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId
          };
        }
        
        // For crypto payments, return success with transaction info
        if (method === 'crypto') {
          await get().fetchBalance(); // Refresh balance
          return {
            success: true,
            message: data.message,
            transactionHash: data.transactionHash,
            conversionRates: data.conversionRates
          };
        }
        
        return { success: true, data };
      } else {
        return { success: false, error: data.message, conversionRates: data.conversionRates };
      }
    } catch (error) {
      console.error('Deposit failed:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isDepositing: false });
    }
  },

  // Confirm Stripe payment
  confirmStripePayment: async (paymentIntentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/savings/confirm-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentIntentId })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh balance after successful payment
        await get().fetchBalance();
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return { success: false, error: error.message };
    }
  },

  getProgress: () => {
    const state = get();
    return (state.balance / state.targetAmount) * 100;
  },

  getMonthlyGrowth: () => {
    const state = get();
    const currentMonth = new Date().getMonth();
    const currentMonthDeposits = state.transactions
      .filter((t) => {
        const transactionMonth = new Date(t.date).getMonth();
        return transactionMonth === currentMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthDeposits = state.transactions
      .filter((t) => {
        const transactionMonth = new Date(t.date).getMonth();
        return transactionMonth === previousMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (previousMonthDeposits === 0) return 0;
    return ((currentMonthDeposits - previousMonthDeposits) / previousMonthDeposits) * 100;
  },

  getLastDeposit: () => {
    const state = get();
    return state.transactions[0]?.amount || 0;
  },

  // Get conversion rates for an amount
  getConversionRates: async (amount) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`/api/savings/conversion-rates?amount=${amount}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ conversionRates: data.conversionRates });
        return data.conversionRates;
      }
    } catch (error) {
      console.error('Failed to get conversion rates:', error);
    }
    return null;
  },

  // Get network information
  getNetworkInfo: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/savings/network-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ networkInfo: data.networkInfo });
        return data.networkInfo;
      }
    } catch (error) {
      console.error('Failed to get network info:', error);
    }
    return null;
  },

  // Deposit USDT to vault using MetaMask
  depositToVault: async (usdtAmount) => {
    try {
      if (!blockchainService.isConnected()) {
        throw new Error('Wallet not connected');
      }

      const result = await blockchainService.depositToVault(usdtAmount);
      
      if (result.success) {
        // Refresh balances after successful deposit
        await get().fetchBalance();
        await get().fetchLiveBlockchainBalance();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to deposit to vault:', error);
      return { success: false, error: error.message };
    }
  },

  // Process crypto payment for booking checkout
  processCryptoPayment: async (amount, useVaultBalance = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const { walletAddress } = get();
      if (!walletAddress) throw new Error('No wallet connected');

      const response = await fetch('/api/savings/crypto-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          walletAddress: walletAddress,
          useVaultBalance: useVaultBalance
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh balance after successful payment
        await get().fetchBalance();
        return { success: true, ...data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Crypto payment failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset store
  reset: () => {
    blockchainService.disconnect();
    set({
      balance: 0,
      blockchainBalance: 0,
      walletAddress: null,
      walletTokenBalance: { eth: 0, usdt: 0 },
      conversionRates: null,
      savingDuration: 30,
      depositAmount: "",
      isDepositing: false,
      isBalanceVisible: false,
      isWalletConnected: false,
      isConnectingWallet: false,
      targetAmount: 13000000,
      transactions: [],
      networkInfo: null
    });
  }
}));

export { useSavingsStore };