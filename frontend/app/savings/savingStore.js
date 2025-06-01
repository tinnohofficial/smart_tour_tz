import { create } from "zustand";

const useSavingsStore = create((set, get) => ({
  balance: 0,
  isBalanceVisible: false,
  isLoading: false,

  setBalance: (newBalance) => set({ balance: newBalance }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Fetch balance from user API
  fetchBalance: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch('/api/auth/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ 
          balance: parseFloat(data.balance) || 0
        });
      } else {
        console.error('Failed to fetch balance - server response:', response.status);
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Update balance
  updateBalance: async (newBalance) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/auth/balance', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: parseFloat(newBalance) })
      });

      const data = await response.json();

      if (response.ok) {
        set({ balance: data.balance });
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Update balance failed:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Deposit funds (simplified - just updates balance)
  depositFunds: async (amount, method) => {
    const currentBalance = get().balance;
    const newBalance = currentBalance + parseFloat(amount);
    
    const result = await get().updateBalance(newBalance);
    if (result.success) {
      return {
        success: true,
        message: `Successfully deposited ${amount} TZS to your account!`
      };
    }
    return result;
  },

  // Reset store
  reset: () => {
    set({
      balance: 0,
      isBalanceVisible: false,
      isLoading: false,
    });
  }
}));

export { useSavingsStore };