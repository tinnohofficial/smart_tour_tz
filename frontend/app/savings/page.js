"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import blockchainService from "../services/blockchainService";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
).catch((error) => {
  console.error("Failed to load Stripe:", error);
  return null;
});

// Validate Stripe configuration
const isStripeConfigured = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return (
    key &&
    key !== "pk_test_placeholder" &&
    key !== "pk_test_placeholder_replace_with_actual_key"
  );
};

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

    // Check if Stripe is configured properly
    if (!isStripeConfigured()) {
      const errorMessage =
        "Payment system not configured. Please contact support.";
      setCardError(errorMessage);
      onError(errorMessage);
      return;
    }

    if (!stripe || !elements) {
      const errorMessage =
        "Payment system not ready. Please refresh and try again.";
      setCardError(errorMessage);
      onError(errorMessage);
      return;
    }

    if (!amount || amount <= 0) {
      const errorMessage = "Please enter a valid amount greater than zero";
      setCardError(errorMessage);
      onError(errorMessage);
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

      if (paymentMethodError) {
        const errorMessage =
          paymentMethodError.message || "Invalid payment information";
        setCardError(errorMessage);
        onError(errorMessage);
        return;
      }

      // Simulate payment processing
      const paymentResult = await simulatePayment(amount, paymentMethod.id);

      if (!paymentResult.success) {
        const errorMessage = "Payment processing failed";
        setCardError(errorMessage);
        onError(errorMessage);
        return;
      }

      // Update user balance
      await updateUserBalance(amount);

      onSuccess({
        amount: amount,
        paymentMethodId: paymentMethod.id,
        currency: "TZS",
      });
    } catch (error) {
      console.error("Payment failed:", error);
      let errorMessage = "Payment failed. Please try again.";

      // Handle specific error types
      if (error.message?.includes("Invalid API Key")) {
        errorMessage =
          "Payment system configuration error. Please contact support.";
      } else if (error.message?.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
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

  const simulatePayment = async (amount, paymentMethodId) => {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For demo purposes, we'll simulate a successful payment
    // In a real implementation, this would integrate with a payment processor
    return {
      success: true,
      payment_method_id: paymentMethodId,
      amount: amount,
      status: "succeeded",
    };
  };

  const updateUserBalance = async (depositAmount) => {
    try {
      const token = getAuthToken();

      // First get current balance
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const balanceResponse = await fetch(`${API_URL}/users/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!balanceResponse.ok) {
        throw new Error("Failed to get current balance");
      }

      const { balance: currentBalance } = await balanceResponse.json();
      const newBalance = currentBalance + depositAmount;

      // Update balance
      const updateResponse = await fetch(`${API_URL}/users/balance`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          balance: newBalance,
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.message || "Failed to update balance");
      }

      return updateResponse.json();
    } catch (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-tanzania-amber-light rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-tanzania-amber-dark" />
          <span className="font-medium">Payment Amount</span>
        </div>
        <p className="text-2xl font-bold text-tanzania-brown">
          {formatTZS(amount)}
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
        {cardError && <p className="text-sm text-red-600">{cardError}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-tanzania-amber hover:bg-tanzania-amber-dark text-white"
        disabled={!stripe || isProcessing || !amount || amount <= 0}
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
    </form>
  );
}

export default function Savings() {
  const [user, setUser] = useState(null);
  const {
    balance,
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

  // Handle TZS amount input change
  const handleTzsAmountChange = (e) => {
    const newTzsAmount = e.target.value;
    setDepositAmount(newTzsAmount);
  };

  useEffect(() => {
    // Get user data from localStorage
    const userData = getUserData();
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role === "tourist") {
        // Initialize blockchain service and fetch balances
        const initBlockchain = async () => {
          await blockchainService.initialize();
          fetchBalance();
        };

        initBlockchain();
      }
    }
  }, [fetchBalance]);

  const handleStripeSuccess = async (paymentResult) => {
    toast.success(
      `Successfully saved ${formatTZS(paymentResult.amount)} to your account!`,
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
      await fetchBalance(); // Refresh balance after deposit
    } else {
      toast.error(
        result.error || "Failed to process crypto deposit. Please try again.",
      );
    }
  };

  const handleConnectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast.error(
          "MetaMask is not installed. Please install MetaMask to continue.",
        );
        return;
      }

      const result = await connectWallet();

      if (result && result.success) {
        toast.success("Wallet connected successfully!");

        // Check if user is on the correct network (Base Sepolia)
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (chainId !== "0x14a34") {
          // Base Sepolia chain ID
          toast.warning(
            "Please switch to Base Sepolia network for full functionality",
          );

          // Optionally try to switch network automatically
          try {
            await blockchainService.switchToBaseSepolia();
            toast.success("Switched to Base Sepolia network");
          } catch (networkError) {
            console.warn(
              "Could not switch network automatically:",
              networkError,
            );
          }
        }
      } else {
        const errorMessage = result?.error || "Failed to connect wallet";

        if (errorMessage.includes("User rejected")) {
          toast.error("Connection cancelled by user");
        } else if (errorMessage.includes("no such account")) {
          toast.error(
            "No accounts found. Please unlock MetaMask and try again.",
          );
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Wallet connection error:", error);

      if (error.message.includes("no such account")) {
        toast.error(
          "No MetaMask accounts found. Please unlock MetaMask and ensure you have at least one account.",
        );
      } else if (error.message.includes("User rejected")) {
        toast.error("Connection cancelled by user");
      } else {
        toast.error(error.message || "Failed to connect wallet");
      }
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      toast.error(error.message || "Failed to disconnect wallet");
    }
  };

  if (!user || user.role !== "tourist") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Only tourists can access the savings feature.
          </p>
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
              {isBalanceVisible ? formatTZS(balance) : "••••••"}
            </span>
          </div>

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
                Select your preferred method to add money to your travel savings
                account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
                    onChange={handleTzsAmountChange}
                    min="1"
                    max="25000000"
                  />
                </div>
              </div>

              <Tabs
                value={activePaymentMethod}
                onValueChange={setActivePaymentMethod}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="stripe"
                    className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit/Debit Card
                  </TabsTrigger>
                  <TabsTrigger
                    value="crypto"
                    disabled={!isWalletConnected}
                    className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-700"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Cryptocurrency
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="space-y-4">
                  {!isStripeConfigured() ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        💳 Card payments are currently unavailable. Please
                        contact support or try cryptocurrency payment.
                      </p>
                    </div>
                  ) : depositAmount &&
                    !isNaN(Number(depositAmount)) &&
                    Number(depositAmount) > 0 ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        amount={Number(depositAmount)}
                        onSuccess={handleStripeSuccess}
                        onError={handleStripeError}
                      />
                    </Elements>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">
                        Please enter a valid amount greater than zero to proceed
                        with card payment.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="crypto" className="space-y-4">
                  {!isWalletConnected ? (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">
                        Connect your MetaMask wallet to deposit with
                        cryptocurrency
                      </p>
                      <Button
                        onClick={handleConnectWallet}
                        disabled={isConnectingWallet || isWalletConnected}
                        className="bg-tanzania-amber hover:bg-tanzania-amber-dark text-white"
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

                      <div className="p-4 bg-amber-50 rounded-lg">
                        {depositAmount &&
                          !isNaN(Number(depositAmount)) &&
                          Number(depositAmount) > 0 && (
                            <div className="mt-3 p-2 bg-white rounded border border-amber-200">
                              <p className="text-sm text-amber-800 font-medium">
                                You will deposit:
                              </p>
                              <p className="text-lg font-bold text-amber-900">
                                {formatTZS(depositAmount)} TZC
                              </p>
                            </div>
                          )}
                      </div>

                      {depositAmount &&
                      !isNaN(Number(depositAmount)) &&
                      Number(depositAmount) > 0 ? (
                        <Button
                          onClick={handleCryptoDeposit}
                          className="w-full bg-tanzania-amber hover:bg-tanzania-amber-dark text-white"
                          disabled={isDepositing}
                        >
                          {isDepositing ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing TZC Deposit...
                            </div>
                          ) : (
                            `Deposit ${formatTZS(depositAmount)} TZC`
                          )}
                        </Button>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Wallet className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">
                            Please enter a valid amount greater than 0 TZC to
                            proceed with deposit.
                          </p>
                        </div>
                      )}
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
