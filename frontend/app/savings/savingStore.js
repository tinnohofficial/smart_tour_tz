import { create } from "zustand";

const useSavingsStore = create((set, get) => ({
  balance: 1800, // Initial balance - in production this would come from API
  savingDuration: 30, // Saving duration in days
  depositAmount: "",
  isDepositing: false,
  isBalanceVisible: false,
  targetAmount: 5000,
  transactions: [
    { id: 1, type: "deposit", amount: 500, method: "Credit Card", date: "2023-05-15" },
    { id: 2, type: "deposit", amount: 1000, method: "Bank Transfer", date: "2023-05-01" },
    { id: 3, type: "deposit", amount: 300, method: "Credit Card", date: "2023-04-22" },
  ],

  setBalance: (newBalance) => set({ balance: newBalance }),
  setSavingDuration: (duration) => set({ savingDuration: duration }),
  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setIsDepositing: (depositing) => set({ isDepositing: depositing }),
  setIsBalanceVisible: (visible) => set({ isBalanceVisible: visible }),
  setTargetAmount: (amount) => set({ targetAmount: amount }),

  toggleBalanceVisibility: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  depositFunds: async (amount, method) => {
    set({ isDepositing: true }); // Set isDepositing to true at the start
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create new transaction
      const newTransaction = {
        id: Date.now(),
        type: "deposit",
        amount: amount,
        method: method,
        date: new Date().toISOString().split('T')[0],
      };

      // Update balance and add transaction
      set((state) => ({
        balance: state.balance + amount,
        depositAmount: "",
        transactions: [newTransaction, ...state.transactions],
      }));

      return { success: true };
    } catch (error) {
      console.error("Deposit failed:", error); // Log error for debugging
      return { success: false };
    } finally {
      set({ isDepositing: false }); // Set isDepositing back to false in finally block
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
}));

export { useSavingsStore };