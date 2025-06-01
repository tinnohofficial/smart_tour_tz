"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, PiggyBank, Wallet } from "lucide-react"
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
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { balance: userBalance, fetchBalance } = useSavingsStore()

  // Fetch user balance on component mount
  useEffect(() => {
    if (isOpen) {
      fetchBalance()
    }
  }, [isOpen, fetchBalance])

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
          result = await processCryptoPayment()
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
    const endpoint = bookingId ? `/api/bookings/${bookingId}/pay` : `/api/cart/checkout`
    const token = localStorage.getItem('token')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: 'stripe',
        ...(cartId && { cartId })
      })
    })

    const data = await response.json()
    return { success: response.ok, ...data }
  }

  const processSavingsPayment = async () => {
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
    if (response.ok) {
      // Refresh balance after successful payment
      await fetchBalance()
    }
    return { success: response.ok, ...data }
  }

  const processCryptoPayment = async () => {
    // Check if wallet is connected
    if (!blockchainService.isConnected()) {
      // Try to connect wallet first
      const connectResult = await blockchainService.connectWallet()
      if (!connectResult.success) {
        throw new Error('Please connect your wallet to proceed with crypto payment')
      }
    }

    try {
      if (bookingId) {
        // Process individual booking payment
        const result = await blockchainService.processCryptoPayment(bookingId, amount, 'vault')
        return result
      } else {
        // Process cart checkout
        const result = await blockchainService.processCryptoCartCheckout(cartId, amount, 'vault')
        return result
      }
    } catch (error) {
      console.error('Crypto payment error:', error)
      throw new Error(error.message || 'Failed to process crypto payment')
    }
  }
  const canPayWithSavings = userBalance >= amount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method for {formatTZS(amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Total Amount</p>
              <p className="text-3xl font-bold text-blue-900">{formatTZS(amount)}</p>
            </div>
          </div>

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {/* Stripe Payment */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex-1">
                <Card className="cursor-pointer hover:bg-gray-50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Pay securely with Stripe</p>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>

            {/* Savings Payment */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="savings" id="savings" disabled={!canPayWithSavings} />
              <Label htmlFor="savings" className="flex-1">
                <Card className={`cursor-pointer ${canPayWithSavings ? 'hover:bg-gray-50' : 'opacity-50'}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <PiggyBank className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Savings Account</p>
                      <p className="text-sm text-gray-600">
                        Available: {formatTZS(userBalance)}
                      </p>
                      {!canPayWithSavings && (
                        <p className="text-xs text-red-600">
                          Insufficient balance. Need {formatTZS(amount - userBalance)} more.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>

            {/* Simple Crypto Payment */}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crypto" id="crypto" />
              <Label htmlFor="crypto" className="flex-1">
                <Card className="cursor-pointer hover:bg-gray-50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Wallet className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-medium">Cryptocurrency</p>
                      <p className="text-sm text-gray-600">Pay with crypto</p>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayment}
              disabled={!paymentMethod || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : `Pay ${formatTZS(amount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}