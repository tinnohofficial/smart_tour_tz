"use client"

import React, { useEffect, useState } from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, CreditCard, Wallet, TrendingUp, ArrowUpCircle, Clock, BanknoteIcon, Link, Unlink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSavingsStore } from "./savingStore"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/app/utils/dateUtils"
import { formatTZS } from "@/app/utils/currency"
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Mock data for transactions (converted to TZS)
const transactions = [
  { id: 1, type: "deposit", amount: 500 * 2600, method: "Credit Card", date: "2023-05-15" },
  { id: 2, type: "deposit", amount: 1000 * 2600, method: "Cryptocurrency", date: "2023-05-01" },
  { id: 3, type: "deposit", amount: 300 * 2600, method: "Credit Card", date: "2023-04-22" },
]

export default function Savings() {
  const {
    balance,
    blockchainBalance,
    walletAddress,
    savingDuration,
    depositAmount,
    isDepositing,
    isBalanceVisible,
    isWalletConnected,
    isConnectingWallet,
    targetAmount,
    setDepositAmount,
    toggleBalanceVisibility,
    depositFunds,
    connectWallet,
    disconnectWallet,
    fetchBalance,
    confirmStripePayment,
  } = useSavingsStore()

  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance()
  }, [])

  const handleDeposit = useCallback(async (method) => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount greater than zero.")
      return
    }

    const amount = Number(depositAmount)
    const walletAddr = method === 'crypto' ? walletAddress : null
    const result = await depositFunds(amount, method, walletAddr)

    if (!result.success) {
      toast.error(result.error || "There was an error processing your deposit. Please try again.")
      return
    }

    if (result.requiresPayment && result.clientSecret) {
      // Handle Stripe payment
      try {
        const stripe = await stripePromise
        const { error, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret)

        if (error) {
          toast.error(error.message)
        } else if (paymentIntent.status === 'succeeded') {
          const confirmResult = await confirmStripePayment(result.paymentIntentId)
          if (confirmResult.success) {
            toast.success(`Successfully deposited ${formatTZS(amount)}.`)
            setDialogOpen(false)
          } else {
            toast.error(confirmResult.error || "Payment confirmation failed")
          }
        }
      } catch (error) {
        toast.error("Payment processing failed")
      }
    } else {
      toast.success(`Successfully deposited ${formatTZS(amount)}.`)
      setDialogOpen(false)
    }
  }, [depositAmount, depositFunds, walletAddress, confirmStripePayment])

  const handleConnectWallet = useCallback(async () => {
    const result = await connectWallet()
    if (result.success) {
      toast.success("Wallet connected successfully!")
    } else {
      toast.error(result.error || "Failed to connect wallet")
    }
  }, [connectWallet])

  const handleDisconnectWallet = useCallback(() => {
    disconnectWallet()
    toast.success("Wallet disconnected")
  }, [disconnectWallet])

  // Calculate fiat and crypto portions
  const fiatBalance = balance - blockchainBalance
  const progress = (balance / targetAmount) * 100

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section with Current Balance */}
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
              {isBalanceVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                <p className="text-sm text-amber-100">Fiat Balance</p>
                <p className="text-xl font-semibold">{formatTZS(fiatBalance)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-amber-100">Crypto Balance</p>
                <p className="text-xl font-semibold">{formatTZS(blockchainBalance)}</p>
              </div>
            </div>
          )}

          {/* Wallet Connection Status */}
          <div className="mt-4 flex items-center gap-2">
            {isWalletConnected ? (
              <div className="flex items-center gap-2 bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm">
                <Link className="h-4 w-4" />
                <span>Wallet Connected</span>
                <span className="text-xs">({walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-100 px-3 py-1 rounded-full text-sm">
                <Unlink className="h-4 w-4" />
                <span>No Wallet Connected</span>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-lg font-medium text-amber-100">Progress to Goal</p>
            <div className="relative pt-2">
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-amber-300/30 backdrop-blur-sm">
                <div
                  style={{ width: `${Math.min(100, progress)}%` }}
                  className={`
                    animate-pulse shadow-none flex flex-col text-center whitespace-nowrap 
                    text-white justify-center bg-gradient-to-r from-white to-amber-100
                    transition-all duration-500 ease-in-out
                  `}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-amber-100">{formatTZS(balance)}</span>
                <span className="text-sm text-amber-100">{formatTZS(targetAmount)}</span>
              </div>
              <div className="absolute -right-2 -top-2">
                <div className="bg-white text-amber-700 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {progress.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
              <p className="text-2xl font-bold">+12.5%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-amber-100 p-3">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Saving Duration</p>
              <p className="text-2xl font-bold">{savingDuration} days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-purple-100 p-3">
              <ArrowUpCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Deposit</p>
              <p className="text-2xl font-bold">{formatTZS(500 * 2600)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Wallet Status</p>
              <div className="flex items-center gap-2">
                {isWalletConnected ? (
                  <>
                    <span className="text-sm font-bold text-green-600">Connected</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectWallet}
                      className="h-6 px-2 text-xs"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleConnectWallet}
                    disabled={isConnectingWallet}
                    className="h-6 px-2 text-xs"
                  >
                    {isConnectingWallet ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2 text-white bg-amber-700 hover:bg-amber-800">
            <BanknoteIcon className="h-5 w-5" />
            Deposit Funds
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method to add funds to your savings.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="credit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="credit">
                <CreditCard className="h-4 w-4 mr-2" />
                Credit Card
              </TabsTrigger>
              <TabsTrigger value="crypto" disabled={!isWalletConnected}>
                <Wallet className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>
            <TabsContent value="credit">
              <form onSubmit={(e) => { e.preventDefault(); handleDeposit("credit") }} className="space-y-4">
                <div>
                  <Label htmlFor="ccAmount">Amount (TZS)</Label>
                  <Input
                    id="ccAmount"
                    type="number"
                    placeholder="Enter amount"
                    className="mt-1.5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-1">Payment will be processed via Stripe</p>
                  <p>Your card details are secure and encrypted.</p>
                </div>
                <Button type="submit" className="w-full text-white bg-amber-700 hover:bg-amber-800" disabled={isDepositing}>
                  {isDepositing ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="crypto">
              {!isWalletConnected ? (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-4">Connect your MetaMask wallet to deposit cryptocurrency</p>
                    <Button 
                      onClick={handleConnectWallet} 
                      disabled={isConnectingWallet}
                      className="text-white bg-amber-700 hover:bg-amber-800"
                    >
                      {isConnectingWallet ? "Connecting..." : "Connect MetaMask"}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleDeposit("crypto") }} className="space-y-4">
                  <div>
                    <Label htmlFor="cryptoAmount">Amount (TZS)</Label>
                    <Input
                      id="cryptoAmount"
                      type="number"
                      placeholder="Enter amount"
                      className="mt-1.5"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-1">Connected Wallet:</p>
                    <p className="font-mono text-xs break-all">{walletAddress}</p>
                    <p className="mt-2">Send USDT to the smart contract and we'll detect your deposit automatically.</p>
                  </div>
                  <Button type="submit" className="w-full text-white bg-amber-700 hover:bg-amber-800" disabled={isDepositing}>
                    {isDepositing ? "Checking Transaction..." : "Verify Crypto Deposit"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest savings activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className="text-green-600">+{formatTZS(transaction.amount)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}