import { create } from "zustand";

const useSavingsStore = create((set, get) => ({
  balance: 0, // Total balance (fiat + crypto in TZS)
  blockchainBalance: 0, // Crypto balance in TZS
  walletAddress: null,
  savingDuration: 30, // Saving duration in days
  depositAmount: "",
  isDepositing: false,
  isBalanceVisible: false,
  isWalletConnected: false,
  isConnectingWallet: false,
  targetAmount: 13000000, // 13M TZS target
  transactions: [],

  setBalance: (newBalance) => set({ balance: newBalance }),
  setBlockchainBalance: (blockchainBalance) => set({ blockchainBalance }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setSavingDuration: (duration) => set({ savingDuration: duration }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setIsWalletConnected: (connected) => set({ isWalletConnected: connected }),
  setIsConnectingWallet: (connecting) => set({ isConnectingWallet: connecting }),
  setTargetAmount: (amount) => set({ targetAmount: amount }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Connect MetaMask wallet
  connectWallet: async () => {
    set({ isConnectingWallet: true });
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          set({ 
            walletAddress: address, 
            isWalletConnected: true 
          });
          
          // Fetch updated balance from backend
          await get().fetchBalance();
          
          return { success: true, address };
        }
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isConnectingWallet: false });
    }
  },

  // Disconnect wallet
  disconnectWallet: () => {
    set({ 
      walletAddress: null, 
      isWalletConnected: false,
      blockchainBalance: 0
    });
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
          isWalletConnected: Boolean(data.walletAddress)
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Fetch live blockchain balance
  fetchLiveBlockchainBalance: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { success: false, error: 'Authentication required' };

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
          isWalletConnected: Boolean(data.walletAddress)
        });
        
        // Also refresh total balance
        await get().fetchBalance();
        
        return { success: true, balance: data.balance, usdtBalance: data.usdtBalance };
      } else {
        throw new Error('Failed to fetch live balance');
      }
    } catch (error) {
      console.error('Failed to fetch live blockchain balance:', error);
      return { success: false, error: error.message };
    }
  },

  depositFunds: async (amount, method, walletAddress = null) => {
    set({ isDepositing: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const requestBody = { 
        amount: amount, 
        method: method === 'credit' ? 'stripe' : 'crypto'
      };
      
      if (method === 'crypto' && walletAddress) {
        requestBody.walletAddress = walletAddress;
      }

      const response = await fetch('/api/savings/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        if (method === 'credit' && data.clientSecret) {
          // Return Stripe client secret for payment processing
          return { 
            success: true, 
            requiresPayment: true, 
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId
          };
        } else {
          // Crypto payment or successful completion
          await get().fetchBalance(); // Refresh balance
          set({ depositAmount: "" });
          return { success: true };
        }
      } else {
        throw new Error(data.message || 'Deposit failed');
      }
    } catch (error) {
      console.error("Deposit failed:", error);
      return { success: false, error: error.message };
    } finally {
      set({ isDepositing: false });
    }
  },

  // Confirm Stripe payment
  confirmStripePayment: async (paymentIntentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

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
        await get().fetchBalance(); // Refresh balance
        return { success: true, newBalance: data.newBalance };
      } else {
        throw new Error(data.message || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error("Payment confirmation failed:", error);
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
        const depositMonth = new Date(t.date).getMonth();
        return t.type === "deposit" && depositMonth === currentMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthDeposits = state.transactions
      .filter((t) => {
        const depositMonth = new Date(t.date).getMonth();
        return t.type === "deposit" && depositMonth === lastMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthDeposits === 0) return 0;
    return ((currentMonthDeposits - lastMonthDeposits) / lastMonthDeposits) * 100;
  },

  getLastDeposit: () => {
    const state = get();
    const deposits = state.transactions.filter((t) => t.type === "deposit");
    return deposits.length > 0 ? deposits[deposits.length - 1] : null;
  },
}));

export default useSavingsStore;
