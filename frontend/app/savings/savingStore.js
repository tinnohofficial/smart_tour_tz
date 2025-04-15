import { create } from "zustand";

// Zustand Store for Savings Component (savingsStore.js - create this file)
const useSavingsStore = create((set, get) => ({
  balance: 1800, // Mock initial balance
  savingDuration: 30, // Mock saving duration in days
  depositAmount: "",
  isDepositing: false,
  isBalanceVisible: false,

  setBalance: (newBalance) => set({ balance: newBalance }),
  setSavingDuration: (duration) => set({ savingDuration: duration }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  depositFunds: async (amount, method) => {
    set({ isDepositing: true }); // Set isDepositing to true at the start
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Simulate successful deposit
      set((state) => ({ balance: state.balance + amount, depositAmount: "" })); // Update balance and reset depositAmount
      return { success: true };
    } catch (error) {
      console.error("Deposit failed:", error); // Log error for debugging
      return { success: false };
    } finally {
      set({ isDepositing: false }); // Set isDepositing back to false in finally block
    }
  },
}));

export { useSavingsStore }