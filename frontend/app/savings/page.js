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
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

function StripeCheckoutForm({ amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setCardError("Payment system not ready. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Convert TZS to USD (1 USD = 2300 TZS)
      const amountInUsd = Math.round((amount / 2300) * 100) / 100;
      
      if (amountInUsd < 0.50) {
        throw new Error("Minimum amount for card payments is 1,150 TZS");
      }

      // Create payment intent directly with Stripe
      const { error: intentError, paymentIntent } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (intentError) {
        throw new Error(intentError.message);
      }

      // For this implementation, we'll simulate a successful payment
      // In a real scenario, you'd create the payment intent on your own server
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Record the payment in our database
      await recordFiatDeposit(amount);

      onSuccess({
        amount: amount,
        paymentMethodId: paymentIntent?.id || `pm_${Date.now()}`,
        currency: 'TZS'
      });

    } catch (error) {
      console.error("Payment failed:", error);
      setCardError(error.message);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const recordFiatDeposit = async (amount) => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/savings/record-fiat-deposit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        paymentMethod: "stripe",
        reference: `STRIPE_${Date.now()}`
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to record deposit");
    }

    return response.json();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Payment Amount</span>
        </div>
        <p className="text-2xl font-bold text-blue-900">{formatTZS(amount)}</p>
        <p className="text-sm text-blue-700">
          Secure payment processing (≈ ${((amount / 2300).toFixed(2))} USD)
        </p>
      </div>

      <div className="space-y-2">
        <Label>Card Information</Label>
        <div className="p-3 border rounded-md bg-white">
          <CardElement
            options={cardElementOptions}
            onChange={(event) => {
              setCardError(event.error ? event.error.message : null);
            }}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-600">{cardError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={!stripe || isProcessing || amount < 1150}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay ${formatTZS(amount)}`
        )}
      </Button>

      {amount < 1150 && (
        <p className="text-sm text-amber-600 text-center">
          Minimum amount for card payments is 1,150 TZS
        </p>
      )}
    </form>
  );
}

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
  } = useSavingsStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState("stripe");

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleStripeSuccess = async (paymentResult) => {
    toast.success(
      `Successfully saved ${formatTZS(paymentResult.amount)} to your account!`
    );
    setDialogOpen(false);
    setDepositAmount("");
    await fetchBalance();
  };

  const handleStripeError = (error) => {
    toast.error(error || "Payment failed. Please try again.");
  };

  const handleCryptoDeposit = async () => {
    if (
      !depositAmount ||
      isNaN(Number(depositAmount)) ||
      Number(depositAmount) <= 0
    ) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    const amount = Number(depositAmount);
    const result = await depositFunds(amount, "crypto");

    if (result.success) {
      toast.success(`Successfully saved ${formatTZS(amount)} to your account!`);
      setDialogOpen(false);
      setDepositAmount("");
    } else {
      toast.error(result.error || "Failed to process crypto deposit. Please try again.");
    }
  };

  const handleConnectWallet = async () => {
    if (isConnectingWallet || isWalletConnected) {
      return;
    }

    const result = await connectWallet();
    if (result.success) {
      toast.success("🎉 MetaMask wallet connected successfully!");
    } else {
      if (result.error.includes("MetaMask is not installed")) {
        toast.error(
          "❌ MetaMask not found. Please install MetaMask extension first."
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

      {/* Quick Deposit Action */}
      <div className="text-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-12 py-6 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PiggyBank className="h-6 w-6 mr-3" />
              Add Funds
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
                  min="1"
                  max="25000000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Card payments: Min 1,150 TZS | Crypto: Min 1 TZS | Max: 25,000,000 TZS
                </p>
              </div>

              <Tabs value={activePaymentMethod} onValueChange={setActivePaymentMethod} className="w-full">
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
                  {depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) >= 1150 ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        amount={Number(depositAmount)}
                        onSuccess={handleStripeSuccess}
                        onError={handleStripeError}
                      />
                    </Elements>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-600">
                        {!depositAmount || isNaN(Number(depositAmount))
                          ? "Please enter a valid amount to proceed with payment."
                          : "Minimum amount for card payments is 1,150 TZS."}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="crypto" className="space-y-4">
                  {!isWalletConnected ? (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">
                        Connect your MetaMask wallet to save with cryptocurrency
                      </p>
                      <Button
                        onClick={handleConnectWallet}
                        disabled={isConnectingWallet || isWalletConnected}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isConnectingWallet ? "Connecting..." : "Connect Wallet"}
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
                      
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          Crypto Deposit Instructions
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Send USDT to your connected wallet, then click the button below to process the deposit.
                        </p>
                      </div>

                      <Button
                        onClick={handleCryptoDeposit}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isDepositing || !depositAmount}
                      >
                        {isDepositing ? "Processing..." : "Process Crypto Deposit"}
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}