"use client"

import React from "react" 
import { useCallback } from "react" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, CreditCard, Wallet } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSavingsStore } from "./savingStore"
import { toast } from "sonner"


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
    setBalance,
    setSavingDuration,
    setDepositAmount,
    setIsDepositing,
    setIsBalanceVisible,
    toggleBalanceVisibility,
    depositFunds,
  } = useSavingsStore(); 


  const handleDeposit = useCallback(async (method) => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount greater than zero.",
        variant: "destructive",
      })
      return
    }

    const amount = Number(depositAmount); // Convert depositAmount to number here for handleDeposit call
    const result = await depositFunds(amount, method); // Call depositFunds from Zustand store

    if (!result.success) {
      toast({
        title: "Deposit failed",
        description: "There was an error processing your deposit. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Deposit successful",
        description: `You have successfully deposited $${amount.toFixed(2)}.`,
      })
    }
  }, [depositAmount, depositFunds, toast]); // Add depositFunds and toast to useCallback dependencies

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Your Savings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Current Balance</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleBalanceVisibility} // Call toggleBalanceVisibility from Zustand store
                aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
              >
                {isBalanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>Your saved funds for future trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-600">
                {isBalanceVisible ? `$${balance.toFixed(2)}` : "••••••"} {/* Use balance from Zustand store */}
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <p className="text-sm text-gray-500">Saving for: {savingDuration} days</p> {/* Use savingDuration from Zustand store */}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Deposit Funds</CardTitle>
            <CardDescription>Add money to your savings</CardDescription>
          </CardHeader>
          <CardContent>
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleDeposit("credit") 
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="ccNumber">Card Number</Label>
                    <Input id="ccNumber" className="p-4 h-12 mt-3" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ccExpiry">Expiry Date</Label>
                      <Input id="ccExpiry" className="p-4 h-12 mt-3" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="ccCVC">CVC</Label>
                      <Input id="ccCVC" className="p-4 h-12 mt-3" placeholder="123" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ccAmount">Amount (USD)</Label>
                    <Input
                      id="ccAmount"
                      type="number"
                      placeholder="Enter amount"
                      className="p-4 h-12 mt-3"
                      value={depositAmount} // Use depositAmount from Zustand store
                      onChange={(e) => setDepositAmount(e.target.value)} // Use setDepositAmount from Zustand store
                    />
                  </div>
                  <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700" disabled={isDepositing}> {/* Use isDepositing from Zustand store */}
                    {isDepositing ? "Processing..." : "Deposit Funds"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="crypto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleDeposit("crypto") 
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="cryptoWallet">Wallet Address</Label>
                    <Input id="cryptoWallet" className="p-4 h-12 mt-3" placeholder="Enter your wallet address" />
                  </div>
                  <div>
                    <Label htmlFor="cryptoAmount">Amount (USD)</Label>
                    <Input
                      id="cryptoAmount"
                      type="number"
                      placeholder="Enter amount"
                      className="p-4 h-12 mt-3"
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
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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