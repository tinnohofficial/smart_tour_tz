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
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
);

export default function Savings() {
  const {
    balance,
    blockchainBalance,
    walletAddress,
    depositAmount,
    isDepositing,
    isBalanceVisible,
    isWalletConnected,
    isConnectingWallet,
    setDepositAmount,
    toggleBalanceVisibility,
    depositFunds,
    connectWallet,
    disconnectWallet,
    fetchBalance,
    confirmStripePayment,
  } = useSavingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDeposit = async (method) => {
    if (
      !depositAmount ||
      isNaN(Number(depositAmount)) ||
      Number(depositAmount) <= 0
    ) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    const amount = Number(depositAmount);
    const result = await depositFunds(amount, method);

    if (!result.success) {
      toast.error(
        result.error || "Failed to process deposit. Please try again.",
      );
      return;
    }

    if (result.requiresPayment && result.clientSecret) {
      try {
        const stripe = await stripePromise;
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          result.clientSecret,
        );

        if (error) {
          toast.error(error.message);
        } else if (paymentIntent.status === "succeeded") {
          const confirmResult = await confirmStripePayment(
            result.paymentIntentId,
          );
          if (confirmResult.success) {
            toast.success(
              `Successfully saved ${formatTZS(amount)} to your account!`,
            );
            setDialogOpen(false);
            setDepositAmount("");
          } else {
            toast.error(confirmResult.error || "Failed to confirm deposit");
          }
        }
      } catch (error) {
        toast.error("Payment processing failed");
      }
    } else {
      toast.success(`Successfully saved ${formatTZS(amount)} to your account!`);
      setDialogOpen(false);
      setDepositAmount("");
    }
  };

  const handleConnectWallet = async () => {
    // Prevent multiple connection attempts
    if (isConnectingWallet || isWalletConnected) {
      return;
    }

    const result = await connectWallet();
    if (result.success) {
      toast.success("🎉 MetaMask wallet connected successfully!");
    } else {
      if (result.error.includes("MetaMask is not installed")) {
        toast.error(
          "❌ MetaMask not found. Please install MetaMask extension first.",
        );
      } else if (result.error.includes("No accounts found")) {
        toast.error("🔒 Please unlock your MetaMask wallet and try again.");
      } else if (result.error.includes("rejected by user")) {
        toast.error("❌ Connection request was cancelled.");
      } else {
        toast.error(`❌ ${result.error}`);
      }
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast.success("✅ MetaMask wallet disconnected");
  };

  const fiatBalance = balance - blockchainBalance;

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
              {isBalanceVisible ? formatTZS(balance) : "••••••"}
            </span>
          </div>

          {/* Balance Breakdown */}
          {isBalanceVisible && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-amber-100">Cash Savings</p>
                <p className="text-xl font-semibold">
                  {formatTZS(fiatBalance)}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-amber-100">Crypto Savings</p>
                <p className="text-xl font-semibold">
                  {formatTZS(blockchainBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Wallet Connection Status & Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWalletConnected ? (
                <div className="flex items-center gap-2 bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet Connected</span>
                  <span className="text-xs">
                    ({walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-orange-500/20 text-orange-100 px-3 py-1 rounded-full text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>No Wallet Connected</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isWalletConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWallet}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Disconnect Wallet
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet || isWalletConnected}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  {isConnectingWallet ? "Connecting..." : "Connect MetaMask"}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Add Money Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Add Money to Your Savings</CardTitle>
          <CardDescription>
            Choose how you'd like to save money for your trip
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PiggyBank className="h-5 w-5 mr-2" />
                Save Money
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Money to Savings</DialogTitle>
                <DialogDescription>
                  Select your preferred method to add money to your travel
                  savings account.
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
                    placeholder="Enter amount to save"
                    className="mt-2 text-lg"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>

                <Tabs defaultValue="stripe" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stripe">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit/Debit Card
                    </TabsTrigger>
                    <TabsTrigger value="crypto" disabled={!isWalletConnected}>
                      <Wallet className="h-4 w-4 mr-2" />
                      Cryptocurrency
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stripe" className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">
                        Secure Payment
                      </p>
                      <p className="text-sm text-amber-700">
                        Your payment is processed securely through Stripe.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDeposit("stripe")}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={isDepositing}
                    >
                      {isDepositing ? "Processing..." : "Save with Card"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="crypto" className="space-y-4">
                    {!isWalletConnected ? (
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 mb-4">
                          Connect your MetaMask wallet to save with
                          cryptocurrency
                        </p>
                        <Button
                          onClick={handleConnectWallet}
                          disabled={isConnectingWallet || isWalletConnected}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {isConnectingWallet
                            ? "Connecting..."
                            : "Connect Wallet"}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            Wallet Connected
                          </p>
                          <p className="text-sm text-green-700 font-mono break-all">
                            {walletAddress}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDisconnectWallet}
                            className="mt-2 text-green-700 hover:text-green-800"
                          >
                            Disconnect
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleDeposit("crypto")}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={isDepositing}
                        >
                          {isDepositing ? "Processing..." : "Save with Crypto"}
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
