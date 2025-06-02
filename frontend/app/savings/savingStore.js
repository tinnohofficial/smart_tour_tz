import { create } from "zustand";
import blockchainService from "../services/blockchainService";

const useSavingsStore = create((set, get) => ({
  balance: 0,
  walletAddress: null,
  isBalanceVisible: false,
  isLoading: false,
  isDepositing: false,
  isWalletConnected: false,
  isConnectingWallet: false,
  depositAmount: "",

  setBalance: (newBalance) => set({ balance: newBalance }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsWalletConnected: (connected) => set({ isWalletConnected: connected }),
  setIsConnectingWallet: (connecting) => set({ isConnectingWallet: connecting }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),

  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Connect to MetaMask wallet
  connectWallet: async () => {
    set({ isConnectingWallet: true });
    try {
      const result = await blockchainService.connectWallet();
      if (result.success) {
        set({ 
          isWalletConnected: true, 
          walletAddress: result.address 
        });

        // Store wallet address in local storage
        localStorage.setItem("walletAddress", result.address);

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return { success: false, error: error.message };
    } finally {
      set({ isConnectingWallet: false });
    }
  },

  // Disconnect wallet
  disconnectWallet: () => {
    blockchainService.disconnect();
    localStorage.removeItem("walletAddress");
    set({ 
      isWalletConnected: false, 
      walletAddress: null
    });
  },

  // Fetch balance from user API
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/users/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({
          balance: parseFloat(data.balance) || 0,
        });
      } else {
        console.error(
          "Failed to fetch balance - server response:",
          response.status,
        );
        if (response.status === 401) {
          localStorage.removeItem("token");
        }
      }

      // Check if wallet was previously connected
      const savedWalletAddress = localStorage.getItem("walletAddress");
      if (savedWalletAddress && !get().isWalletConnected) {
        set({ 
          isWalletConnected: true,
          walletAddress: savedWalletAddress
        });
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Update balance
  updateBalance: async (newBalance) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/users/balance`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ balance: parseFloat(newBalance) }),
      });

      const data = await response.json();

      if (response.ok) {
        set({ balance: data.balance });
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("Update balance failed:", error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Deposit funds (both crypto and fiat update the same unified balance)
  depositFunds: async (amount, method) => {
    if (method === "crypto") {
      set({ isDepositing: true });
      try {
        const amountInTZC = parseFloat(amount);

        // Deposit to smart contract (this will emit an event)
        const result = await blockchainService.depositToVault(amountInTZC);

        if (result.success) {
          // After successful blockchain deposit, update the database balance
          const currentBalance = get().balance;
          const newBalance = currentBalance + amountInTZC;
          
          const updateResult = await get().updateBalance(newBalance);
          if (updateResult.success) {
            return {
              success: true,
              message: `Successfully deposited ${amount} TZS to your account!`,
              txHash: result.transactionHash
            };
          } else {
            return { success: false, error: "Failed to update balance in database" };
          }
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Crypto deposit failed:", error);
        return { success: false, error: error.message };
      } finally {
        set({ isDepositing: false });
      }
    } else {
      // Regular fiat deposit
      set({ isDepositing: true });
      try {
        const currentBalance = get().balance;
        const depositAmount = parseFloat(amount);
        const newBalance = currentBalance + depositAmount;

        const result = await get().updateBalance(newBalance);
        if (result.success) {
          return {
            success: true,
            message: `Successfully deposited ${amount} TZS to your account!`,
          };
        }
        return result;
      } catch (error) {
        console.error("Deposit failed:", error);
        return { success: false, error: error.message };
      } finally {
        set({ isDepositing: false });
      }
    }
  },

  // Reset store
  reset: () => {
    set({
      balance: 0,
      walletAddress: null,
      isBalanceVisible: false,
      isLoading: false,
      isDepositing: false,
      isWalletConnected: false,
      isConnectingWallet: false,
      depositAmount: "",
    });
  },
}))

export { useSavingsStore };
