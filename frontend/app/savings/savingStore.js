import { create } from "zustand";

const useSavingsStore = create((set, get) => ({
  balance: 0,
  isBalanceVisible: false,

  setBalance: (newBalance) => set({ balance: newBalance }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  // Fetch balance from backend API
  fetchBalance: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      // Since we removed the balance endpoint, we'll just set balance to 0 for now
      // This can be updated when a proper simple balance endpoint is created
      set({ balance: 0 });
      
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Create savings account
  createSavingsAccount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/savings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        set({ balance: data.balance || 0 });
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Create savings account failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Update savings balance
  updateBalance: async (newBalance) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/savings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: newBalance })
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
    }
  },

  // Reset store
  reset: () => {
    set({
      balance: 0,
      isBalanceVisible: false,
    });
  }
}));

export { useSavingsStore };