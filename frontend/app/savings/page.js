"use client"

import React from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, CreditCard, Wallet, TrendingUp, ArrowUpCircle, Clock, BanknoteIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSavingsStore } from "./savingStore"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/app/utils/dateUtils"

// Mock data for transactions
const transactions = [
  { id: 1, type: "deposit", amount: 500, method: "Credit Card", date: "2023-05-15" },
  { id: 2, type: "deposit", amount: 1000, method: "Cryptocurrency", date: "2023-05-01" },
  { id: 3, type: "deposit", amount: 300, method: "Credit Card", date: "2023-04-22" },
]

export default function Savings() {
  const {
    balance,
    savingDuration,
    depositAmount,
    isDepositing,
    isBalanceVisible,
    setDepositAmount,
    toggleBalanceVisibility,
    depositFunds,
  } = useSavingsStore()

  const handleDeposit = useCallback(async (method) => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount greater than zero.")
      return
    }

    const amount = Number(depositAmount)
    const result = await depositFunds(amount, method)

    if (!result.success) {
      toast.error("There was an error processing your deposit. Please try again.")
    } else {
      toast.success(`Successfully deposited $${amount.toFixed(2)}.`)
    }
  }, [depositAmount, depositFunds])

  // Calculate savings progress (example: target is $5000)
  const targetAmount = 5000
  const progress = (balance / targetAmount) * 100

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section with Current Balance */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 p-8 text-white shadow-lg">
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
          <p className="mt-2 text-xl font-medium">Current Balance</p>
          <div className="mt-4">
            <span className="text-5xl font-bold">
              {isBalanceVisible ? `$${balance.toFixed(2)}` : "••••••"}
            </span>
          </div>
          <div className="mt-6 space-y-4">
            <p className="text-lg font-medium text-blue-100">Progress to Goal</p>
            <div className="relative pt-2">
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-blue-300/30 backdrop-blur-sm">
                <div
                  style={{ width: `${Math.min(100, progress)}%` }}
                  className={`
                    animate-pulse shadow-none flex flex-col text-center whitespace-nowrap 
                    text-white justify-center bg-gradient-to-r from-white to-blue-100
                    transition-all duration-500 ease-in-out
                  `}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-blue-100">${balance.toFixed(2)}</span>
                <span className="text-sm text-blue-100">${targetAmount.toFixed(2)}</span>
              </div>
              <div className="absolute -right-2 -top-2">
                <div className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {progress.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
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
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
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
              <p className="text-2xl font-bold">$500.00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2 text-white bg-blue-600 hover:bg-blue-700">
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
              <TabsTrigger value="crypto">
                <Wallet className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>
            <TabsContent value="credit">
              <form onSubmit={(e) => { e.preventDefault(); handleDeposit("credit") }} className="space-y-4">
                <div>
                  <Label htmlFor="ccNumber">Card Number</Label>
                  <Input id="ccNumber" className="mt-1.5" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ccExpiry">Expiry Date</Label>
                    <Input id="ccExpiry" className="mt-1.5" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="ccCVC">CVC</Label>
                    <Input id="ccCVC" className="mt-1.5" placeholder="123" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ccAmount">Amount (USD)</Label>
                  <Input
                    id="ccAmount"
                    type="number"
                    placeholder="Enter amount"
                    className="mt-1.5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700" disabled={isDepositing}>
                  {isDepositing ? "Processing..." : "Deposit Funds"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="crypto">
              <form onSubmit={(e) => { e.preventDefault(); handleDeposit("crypto") }} className="space-y-4">
                <div>
                  <Label htmlFor="cryptoWallet">Wallet Address</Label>
                  <Input id="cryptoWallet" className="mt-1.5" placeholder="Enter your wallet address" />
                </div>
                <div>
                  <Label htmlFor="cryptoAmount">Amount (USD)</Label>
                  <Input
                    id="cryptoAmount"
                    type="number"
                    placeholder="Enter amount"
                    className="mt-1.5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700" disabled={isDepositing}>
                  {isDepositing ? "Processing..." : "Deposit Funds"}
                </Button>
              </form>
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
                    <span className="text-green-600">+${transaction.amount.toFixed(2)}</span>
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