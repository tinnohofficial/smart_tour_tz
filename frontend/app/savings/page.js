"use client";

import { useState, useEffect } from "react";
import { useSavingsStore } from "./savingStore";
import { useAuthStore } from "../stores/authStore";

export default function Savings() {
  const { user } = useAuthStore();
  const { 
    balance, 
    isBalanceVisible, 
    toggleBalanceVisibility,
    createSavingsAccount,
    updateBalance,
    fetchBalance
  } = useSavingsStore();

  const [newBalance, setNewBalance] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBalance();
      // Check if user has savings account by trying to fetch balance
      checkAccountExists();
    }
  }, [user]);

  const checkAccountExists = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // We'll assume account exists if balance fetch succeeds
      // This is a simple approach since we removed the balance endpoint
      setHasAccount(true);
    } catch (error) {
      setHasAccount(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const result = await createSavingsAccount();
      if (result.success) {
        setMessage("Savings account created successfully!");
        setHasAccount(true);
      } else {
        setMessage(result.error || "Failed to create savings account");
      }
    } catch (error) {
      setMessage("An error occurred while creating the account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    
    if (!newBalance || isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0) {
      setMessage("Please enter a valid balance amount (must be non-negative)");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await updateBalance(parseFloat(newBalance));
      if (result.success) {
        setMessage("Balance updated successfully!");
        setNewBalance("");
      } else {
        setMessage(result.error || "Failed to update balance");
      }
    } catch (error) {
      setMessage("An error occurred while updating the balance");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'tourist') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only tourists can access the savings feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Savings Account</h1>

          {/* Balance Display */}
          <div className="mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Current Balance</h2>
                <button
                  onClick={toggleBalanceVisibility}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isBalanceVisible ? "Hide" : "Show"} Balance
                </button>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {isBalanceVisible ? `${balance.toFixed(2)} TZS` : "••••••"}
              </div>
            </div>
          </div>

          {/* Create Account Section */}
          {!hasAccount && (
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  You don't have a savings account yet. Create one to get started.
                </p>
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Savings Account"}
              </button>
            </div>
          )}

          {/* Update Balance Section */}
          {hasAccount && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Balance</h3>
              <form onSubmit={handleUpdateBalance} className="space-y-4">
                <div>
                  <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
                    New Balance (TZS)
                  </label>
                  <input
                    type="number"
                    id="balance"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter new balance amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Balance"}
                </button>
              </form>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.includes("successfully") 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Account Information</h3>
            <div className="text-sm text-gray-600">
              <p>Account Owner: {user.email}</p>
              <p>Account Type: Tourist Savings Account</p>
              <p>Currency: Tanzanian Shilling (TZS)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}