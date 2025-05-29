"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Coins,
  Shield
} from "lucide-react"
import { toast } from "sonner"
import { formatTZS } from "@/app/utils/currency"
import { useSavingsStore } from "@/app/savings/savingStore"
import blockchainService from "@/app/services/blockchainService"

export function EnhancedPaymentDialog({ 
  isOpen, 
  onClose, 
  amount, 
  onPaymentSuccess,
  bookingId = null,
  cartId = null
}) {
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cryptoPaymentStep, setCryptoPaymentStep] = useState("select") // select, deposit, confirm
  const [useVaultBalance, setUseVaultBalance] = useState(false)
  const [conversionRates, setConversionRates] = useState(null)
  const [networkInfo, setNetworkInfo] = useState(null)
  const [depositProgress, setDepositProgress] = useState(0)

  const {
    balance: savingsBalance,
    blockchainBalance,
    walletAddress,
    walletTokenBalance,
    isWalletConnected,
    isConnectingWallet,
    connectWallet,
    disconnectWallet,
    getConversionRates,
    getNetworkInfo,
    processCryptoPayment,
    depositToVault
  } = useSavingsStore()

  // Load conversion rates and network info on mount
  useEffect(() => {
    if (isOpen && amount) {
      loadPaymentData()
    }
  }, [isOpen, amount])

  const loadPaymentData = async () => {
    try {
      const [rates, network] = await Promise.all([
        getConversionRates(amount),
        getNetworkInfo()
      ])
      setConversionRates(rates)
      setNetworkInfo(network)
    } catch (error) {
      console.error("Error loading payment data:", error)
    }
  }

  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (result.success) {
      toast.success("Wallet connected successfully!")
      await loadPaymentData()
    } else {
      toast.error(result.error || "Failed to connect wallet")
    }
  }

  const handleProcessPayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setIsProcessing(true)

    try {
      let result

      switch (paymentMethod) {
        case "stripe":
          result = await processStripePayment()
          break
        case "savings":
          result = await processSavingsPayment()
          break
        case "crypto":
          result = await processCryptoPaymentFlow()
          break
        default:
          throw new Error("Invalid payment method")
      }

      if (result.success) {
        toast.success("Payment processed successfully!")
        onPaymentSuccess(result)
        onClose()
      } else {
        toast.error(result.error || "Payment failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const processStripePayment = async () => {
    // Implement Stripe payment logic
    // This would integrate with your existing Stripe implementation
    return { success: true, method: "stripe" }
  }

  const processSavingsPayment = async () => {
    // Call your existing savings payment API
    const endpoint = bookingId ? `/api/bookings/${bookingId}/pay` : `/api/cart/checkout`
    const token = localStorage.getItem('token')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: 'savings',
        ...(cartId && { cartId })
      })
    })

    const data = await response.json()
    return { success: response.ok, ...data }
  }

  const processCryptoPaymentFlow = async () => {
    if (!isWalletConnected) {
      throw new Error("Wallet not connected")
    }

    if (useVaultBalance) {
      // Use vault balance for automatic payment
      const result = await processCryptoPayment(amount, true)
      return result
    } else {
      // New deposit flow
      setCryptoPaymentStep("deposit")
      return await handleNewCryptoDeposit()
    }
  }

  const handleNewCryptoDeposit = async () => {
    if (!conversionRates) {
      throw new Error("Conversion rates not loaded")
    }

    const usdtAmount = conversionRates.usdt

    // Check if user has sufficient USDT in wallet
    if (parseFloat(walletTokenBalance.usdt) < usdtAmount) {
      throw new Error(`Insufficient USDT balance. Required: ${usdtAmount.toFixed(2)} USDT, Available: ${walletTokenBalance.usdt} USDT`)
    }

    // Deposit to vault
    setCryptoPaymentStep("confirm")
    setDepositProgress(25)

    const depositResult = await depositToVault(usdtAmount)
    setDepositProgress(75)

    if (!depositResult.success) {
      throw new Error(depositResult.error || "Deposit to vault failed")
    }

    setDepositProgress(100)

    // Process payment using the deposit
    const paymentResult = await processCryptoPayment(amount, false)
    return paymentResult
  }

  const canPayWithSavings = savingsBalance >= amount
  const canPayWithVault = blockchainBalance >= amount
  const canPayWithNewDeposit = isWalletConnected && 
    conversionRates && 
    parseFloat(walletTokenBalance.usdt) >= conversionRates.usdt

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Secure Payment
          </DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for {formatTZS(amount)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
          <TabsList className="w-full mb-4 grid grid-cols-3">
            <TabsTrigger value="stripe" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" /> Stripe
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1">
              <Wallet className="h-4 w-4 mr-2" /> Savings
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex-1">
              <Coins className="h-4 w-4 mr-2" /> Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Stripe Payment</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Secure payment processing via Stripe. Supports major credit and debit cards.
              </p>
              <div className="flex justify-between items-center">
                <span>Amount:</span>
                <span className="font-semibold">{formatTZS(amount)}</span>
              </div>
              {conversionRates && (
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Approx USD:</span>
                  <span>${conversionRates.usd.toFixed(2)}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Pay from Savings</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Available Balance:</span>
                  <span className="font-semibold">{formatTZS(savingsBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Required:</span>
                  <span className="font-semibold">{formatTZS(amount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-medium">
                  <span>After Payment:</span>
                  <span className={canPayWithSavings ? "text-green-600" : "text-red-600"}>
                    {formatTZS(Math.max(0, savingsBalance - amount))}
                  </span>
                </div>
              </div>
              {!canPayWithSavings && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient funds. Please add {formatTZS(amount - savingsBalance)} to your savings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            {!isWalletConnected ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">Connect your MetaMask wallet to pay with cryptocurrency</p>
                <Button 
                  onClick={handleConnectWallet}
                  disabled={isConnectingWallet}
                  className="text-white bg-amber-700 hover:bg-amber-800"
                >
                  {isConnectingWallet ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect MetaMask"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet Info */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Wallet Connected</span>
                  </div>
                  <p className="text-xs font-mono text-green-700 break-all">
                    {walletAddress}
                  </p>
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  {/* Vault Balance Option */}
                  {blockchainBalance > 0 && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="useVault"
                          checked={useVaultBalance}
                          onCheckedChange={setUseVaultBalance}
                          disabled={!canPayWithVault}
                        />
                        <div className="flex-1">
                          <label htmlFor="useVault" className="text-sm font-medium">
                            Use Vault Balance
                          </label>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-600">
                              Available: {formatTZS(blockchainBalance)}
                            </span>
                            {canPayWithVault && (
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Instant
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {!canPayWithVault && (
                        <p className="text-xs text-red-600 mt-2">
                          Insufficient vault balance. Need {formatTZS(amount - blockchainBalance)} more.
                        </p>
                      )}
                    </div>
                  )}

                  {/* New Deposit Option */}
                  {!useVaultBalance && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Pay with USDT</span>
                      </div>
                      {conversionRates && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Amount (TZS):</span>
                            <span>{formatTZS(amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount (USDT):</span>
                            <span>{conversionRates.usdt.toFixed(2)} USDT</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Wallet USDT:</span>
                            <span>{parseFloat(walletTokenBalance.usdt).toFixed(2)} USDT</span>
                          </div>
                        </div>
                      )}
                      {canPayWithNewDeposit ? (
                        <Badge variant="secondary" className="text-xs mt-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sufficient Balance
                        </Badge>
                      ) : (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Insufficient USDT in wallet. 
                            {conversionRates && ` Need ${(conversionRates.usdt - parseFloat(walletTokenBalance.usdt)).toFixed(2)} more USDT.`}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress for crypto payment */}
                {cryptoPaymentStep !== "select" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Payment...</span>
                      <span>{depositProgress}%</span>
                    </div>
                    <Progress value={depositProgress} className="h-2" />
                    <p className="text-xs text-gray-600">
                      {cryptoPaymentStep === "deposit" && "Depositing USDT to vault..."}
                      {cryptoPaymentStep === "confirm" && "Confirming transaction..."}
                    </p>
                  </div>
                )}

                {/* Network Info */}
                {networkInfo && (
                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span>{networkInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chain ID:</span>
                      <span>{networkInfo.chainId}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={
              isProcessing ||
              (paymentMethod === "savings" && !canPayWithSavings) ||
              (paymentMethod === "crypto" && !isWalletConnected) ||
              (paymentMethod === "crypto" && !useVaultBalance && !canPayWithNewDeposit) ||
              (paymentMethod === "crypto" && useVaultBalance && !canPayWithVault)
            }
            className="text-white bg-amber-700 hover:bg-amber-800"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {formatTZS(amount)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}