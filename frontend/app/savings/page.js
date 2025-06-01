"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, CreditCard, Wallet, PiggyBank } from "lucide-react";
import { useSavingsStore } from "./savingStore";
import { useAuthStore } from "../stores/authStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatTZS } from "@/app/utils/currency";

export default function Savings() {
  const { user } = useAuthStore();
  const {
    balance,
    isBalanceVisible,
    isLoading,
    toggleBalanceVisibility,
    depositFunds,
    updateBalance,
    fetchBalance,
  } = useSavingsStore();

  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState("direct");

  useEffect(() => {
    if (user && user.role === 'tourist') {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  const handleDirectDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    const amount = Number(depositAmount);
    if (amount < 1) {
      toast.error("Minimum deposit amount is 1 TZS");
      return;
    }

    if (amount > 25000000) {
      toast.error("Maximum deposit amount is 25,000,000 TZS");
      return;
    }

    setIsDepositing(true);
    try {
      const result = await depositFunds(amount, "direct");
      if (result.success) {
        toast.success(result.message);
        setDialogOpen(false);
        setDepositAmount("");
      } else {
        toast.error(result.error || "Failed to deposit funds");
      }
    } catch (error) {
      toast.error("An error occurred during deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) < 0) {
      toast.error("Please enter a valid balance amount.");
      return;
    }

    const newBalance = Number(depositAmount);
    setIsDepositing(true);
    try {
      const result = await updateBalance(newBalance);
      if (result.success) {
        toast.success("Balance updated successfully!");
        setDialogOpen(false);
        setDepositAmount("");
      } else {
        toast.error(result.error || "Failed to update balance");
      }
    } catch (error) {
      toast.error("An error occurred while updating balance");
    } finally {
      setIsDepositing(false);
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
    <div className="container mx-auto py-8 space-y-8">
      {/* Current Balance Card */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-700 to-amber-500 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Your Travel Savings</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleBalanceVisibility}
            >
              {isBalanceVisible ? (
                <EyeOff className="h-7 w-7" />
              ) : (
                <Eye className="h-7 w-7" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xl font-medium">Total Balance</p>
          <div className="mt-4">
            <span className="text-5xl font-bold">
              {isLoading ? "Loading..." : isBalanceVisible ? formatTZS(balance) : "••••••"}
            </span>
          </div>

          {/* Balance Info */}
          {isBalanceVisible && (
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-amber-100">Available Balance</p>
                <p className="text-xl font-semibold">
                  {formatTZS(balance)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm">
                <Wallet className="h-4 w-4" />
                <span>Active Account</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Quick Deposit Action */}
      <div className="text-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-12 py-6 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PiggyBank className="h-6 w-6 mr-3" />
              Manage Funds
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Manage Your Savings</DialogTitle>
              <DialogDescription>
                Add money to your travel savings account or update your balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-base font-medium">
                  Amount (TZS)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="mt-2 text-lg"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  max="25000000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Min: 1 TZS | Max: 25,000,000 TZS
                </p>
              </div>

              <Tabs value={activePaymentMethod} onValueChange={setActivePaymentMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct">
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Add Funds
                  </TabsTrigger>
                  <TabsTrigger value="update">
                    <Wallet className="h-4 w-4 mr-2" />
                    Set Balance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Add to Current Balance</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      This will add the amount to your existing balance of {formatTZS(balance)}
                    </p>
                    <div className="flex justify-between items-center">
                      <span>New Balance Will Be:</span>
                      <span className="font-semibold text-green-600">
                        {depositAmount ? formatTZS(balance + Number(depositAmount)) : formatTZS(balance)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleDirectDeposit}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isDepositing || !depositAmount}
                  >
                    {isDepositing ? "Processing..." : `Add ${depositAmount ? formatTZS(Number(depositAmount)) : "Funds"}`}
                  </Button>
                </TabsContent>

                <TabsContent value="update" className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Set Exact Balance</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      This will set your balance to exactly the amount entered
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span>{formatTZS(balance)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>New Balance:</span>
                        <span className="text-blue-600">
                          {depositAmount ? formatTZS(Number(depositAmount)) : formatTZS(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleUpdateBalance}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isDepositing || !depositAmount}
                  >
                    {isDepositing ? "Updating..." : `Set Balance to ${depositAmount ? formatTZS(Number(depositAmount)) : "0"}`}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Information */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-amber-600" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your travel savings account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Account Holder</p>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Account Type</p>
              <p className="text-gray-600">Tourist Savings Account</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Currency</p>
              <p className="text-gray-600">Tanzanian Shilling (TZS)</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Status</p>
              <p className="text-green-600 font-medium">Active</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your savings can be used to pay for bookings and travel expenses
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}