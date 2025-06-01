"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  AlertTriangle,
  CheckCircle,
  Info,
  History,
} from "lucide-react";
import { useWithdrawStore } from "./withdrawStore";

export default function AdminWithdrawPage() {
  const {
    isLoading,
    vaultBalance,
    balanceLoading,
    withdrawAmount,
    error,
    success,
    isAdminInitialized,
    transactionHistory,
    setWithdrawAmount,
    initializeAndFetchBalance,
    performWithdraw,
    setMaxAmount,
  } = useWithdrawStore();

  // Initialize admin and fetch vault balance
  useEffect(() => {
    initializeAndFetchBalance();
  }, [initializeAndFetchBalance]);

  const handleWithdraw = async () => {
    await performWithdraw();
  };

  const handleMaxWithdraw = () => {
    setMaxAmount();
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Withdraw Funds
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Withdraw TZC tokens from the Smart Tour vault to your admin wallet.
        </p>
      </div>

      {/* Admin Status Alert */}
      {!isAdminInitialized && !balanceLoading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Not Initialized</AlertTitle>
          <AlertDescription>
            Admin functionality is not properly configured. Please ensure your
            admin private key is set in the environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Vault Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Vault Balance
          </CardTitle>
          <CardDescription>
            Total TZC tokens available in the Smart Tour vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-bold text-amber-700">
              {vaultBalance
                ? `${parseFloat(vaultBalance).toLocaleString()} TZC`
                : "0 TZC"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      {isAdminInitialized && (
        <Card>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Withdrawal Successful
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-1">
                    <p>Successfully withdrew {success.amount} TZC</p>
                    <p className="text-xs">
                      Transaction: {success.transactionHash}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Withdrawal Amount (TZC)</Label>
              <div className="flex gap-2">
                <Input
                  id="withdrawAmount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  step="0.000000000000000001"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={handleMaxWithdraw}
                  disabled={
                    isLoading || !vaultBalance || parseFloat(vaultBalance) === 0
                  }
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              disabled={
                isLoading ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                !vaultBalance ||
                parseFloat(withdrawAmount) > parseFloat(vaultBalance)
              }
              className="w-full bg-amber-700 hover:bg-amber-800 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Withdrawal...
                </>
              ) : (
                <>Withdraw Funds</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {transactionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Withdrawals
            </CardTitle>
            <CardDescription>
              Your recent withdrawal transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionHistory.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tx.amount} TZC</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-medium">
                      {tx.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.transactionHash.slice(0, 10)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Network Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Network: Base Sepolia Testnet</p>
            <p>Token: Tanzania Shilling Coin (TZC)</p>
            <p>Contract: Smart Tour Vault</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
