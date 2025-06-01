import { create } from "zustand";

const useSavingsStore = create((set, get) => ({
  balance: 0,
  blockchainBalance: 0,
  walletAddress: null,
  depositAmount: "",
  isDepositing: false,
  isBalanceVisible: false,
  isWalletConnected: false,
  isConnectingWallet: false,


  setBalance: (newBalance) => set({ balance: newBalance }),
  setBlockchainBalance: (blockchainBalance) => set({ blockchainBalance }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setIsWalletConnected: (connected) => set({ isWalletConnected: connected }),
  setIsConnectingWallet: (connecting) => set({ isConnectingWallet: connecting }),


  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Connect MetaMask wallet
  connectWallet: async () => {
    const currentState = get();
    
    // If wallet is already connected, return success
    if (currentState.isWalletConnected && currentState.walletAddress) {
      return { success: true, address: currentState.walletAddress };
    }

    set({ isConnectingWallet: true });
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      let accounts;
      try {
        // First try to get existing accounts
        accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        // If no accounts are connected, request connection
        if (!accounts || accounts.length === 0) {
          accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
        }
      } catch (requestError) {
        // If the user rejected the request or other error occurred
        if (requestError.code === 4001) {
          throw new Error('Connection request was rejected by user.');
        }
        throw new Error('Failed to connect to MetaMask. Please try again.');
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      const address = accounts[0];
      
      if (!address || typeof address !== 'string' || address.length === 0) {
        throw new Error('Invalid wallet address received from MetaMask.');
      }
      set({ 
        walletAddress: address, 
        isWalletConnected: true 
      });
      
      // Connect wallet with backend
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/savings/connect-wallet', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: address })
          });

          if (!response.ok) {
            console.warn('Backend wallet connection failed, but continuing with local connection');
          }
        } catch (backendError) {
          console.warn('Backend wallet connection failed:', backendError);
          // Continue with local connection even if backend fails
        }
      }
      
      await get().fetchBalance();
      return { success: true, address };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        walletAddress: null, 
        isWalletConnected: false 
      });
      
      // Handle specific error types
      let errorMessage = 'Failed to connect wallet';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && Object.keys(error).length === 0) {
        errorMessage = 'MetaMask connection failed. Please ensure MetaMask is unlocked and try again.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      set({ isConnectingWallet: false });
    }
  },

  // Disconnect wallet
  disconnectWallet: async () => {
    try {
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
        blockchainBalance: 0
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      set({ 
        walletAddress: null, 
        isWalletConnected: false,
        blockchainBalance: 0
      });
    }
  },

  // Fetch balance from backend API
  fetchBalance: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch('/api/savings/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ 
          balance: parseFloat(data.balance) || 0,
          blockchainBalance: parseFloat(data.blockchainBalance) || 0,
          walletAddress: data.walletAddress || null,
          isWalletConnected: Boolean(data.walletAddress)
        });
      } else {
        console.error('Failed to fetch balance - server response:', response.status);
        if (response.status === 401) {
          // Token might be expired
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Deposit funds (crypto only - fiat is handled in frontend)
  depositFunds: async (amount, method) => {
    set({ isDepositing: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      if (method !== 'crypto') {
        return { success: false, error: 'Only crypto deposits are handled in the store' };
      }

      const payload = {
        amount: parseFloat(amount),
        method: method,
        walletAddress: get().walletAddress
      };

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
        await get().fetchBalance();
        return {
          success: true,
          message: data.message
        };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Crypto deposit failed:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isDepositing: false });
    }
  },





  // Reset store
  reset: () => {
    set({
      balance: 0,
      blockchainBalance: 0,
      walletAddress: null,
      depositAmount: "",
      isDepositing: false,
      isBalanceVisible: false,
      isWalletConnected: false,
      isConnectingWallet: false,

    });
  }
}));

export { useSavingsStore };