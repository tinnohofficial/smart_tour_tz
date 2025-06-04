'use client'

import React, { useState, useCallback } from 'react'
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Wallet, PiggyBank, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy')

// Stripe Checkout Form Component
function StripeCheckoutForm({ amount, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsProcessing(true)
    setCardError('')

    if (!stripe || !elements) {
      const errorMessage = "Payment system not configured. Please contact support."
      setCardError(errorMessage)
      onError(errorMessage)
      setIsProcessing(false)
      return
    }

    if (!elements) {
      const errorMessage = "Payment system not ready. Please refresh and try again."
      setCardError(errorMessage)
      onError(errorMessage)
      setIsProcessing(false)
      return
    }

    try {
      const cardElement = elements.getElement(CardElement)

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      })

      if (paymentMethodError) {
        const errorMessage = paymentMethodError.message || "Invalid payment information"
        setCardError(errorMessage)
        onError(errorMessage)
        setIsProcessing(false)
        return
      }

      // Simulate payment processing for booking
      const paymentResult = await simulateBookingPayment(amount, paymentMethod.id)

      if (!paymentResult.success) {
        const errorMessage = "Payment processing failed"
        setCardError(errorMessage)
        onError(errorMessage)
        setIsProcessing(false)
        return
      }

      onSuccess({
        amount: amount,
        paymentMethodId: paymentMethod.id,
        currency: "TZS",
      })
    } catch (error) {
      console.error("Payment failed:", error)
      let errorMessage = "Payment failed. Please try again."

      // Handle specific error types
      if (error.message?.includes("Invalid API Key")) {
        errorMessage = "Payment system configuration error. Please contact support."
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again."
      }

      setCardError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateBookingPayment = async (amount, paymentMethodId) => {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // For demo purposes, we'll simulate a successful payment
    // In a real implementation, this would integrate with a payment processor
    return {
      success: true,
      payment_method_id: paymentMethodId,
      amount: amount,
      status: "succeeded",
    }
  }

  const formatTZS = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          <span className="font-medium">Payment Amount</span>
        </div>
        <p className="text-2xl font-bold text-blue-800">{formatTZS(amount)}</p>
      </div>

      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {cardError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cardError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay ${formatTZS(amount)}`
        )}
      </Button>
    </form>
  )
}

export default function PaymentDialog({ 
  isOpen, 
  onClose, 
  totalAmount, 
  userBalance = 0, 
  onPaymentSuccess, 
  title = "Select Payment Method",
  description = "Choose how you want to pay for your booking.",
  applySavingsDiscount = true 
}) {
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate discounted price for savings payments (5% discount)
  const discountedPrice = applySavingsDiscount ? totalAmount * 0.95 : totalAmount
  const savingsDiscount = totalAmount - discountedPrice

  const formatTZS = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const processSavingsPayment = useCallback(async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (paymentMethod === "savings" && userBalance < discountedPrice) {
      toast.error("Insufficient funds in savings account")
      return
    }

    setIsProcessing(true)

    try {
      const paymentResult = {
        paymentMethod: "savings",
        amount: discountedPrice,
        success: true
      }

      await onPaymentSuccess(paymentResult)
    } catch (error) {
      console.error("Error processing savings payment:", error)
      toast.error("Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [paymentMethod, userBalance, discountedPrice, onPaymentSuccess])

  const handleStripePaymentSuccess = useCallback(async (paymentResult) => {
    try {
      const result = {
        paymentMethod: "stripe", 
        amount: totalAmount,
        paymentMethodId: paymentResult.paymentMethodId,
        success: true
      }

      await onPaymentSuccess(result)
    } catch (error) {
      console.error("Error processing stripe payment:", error)
      toast.error("Payment processing failed. Please try again.")
    }
  }, [totalAmount, onPaymentSuccess])

  const handleStripePaymentError = useCallback((error) => {
    console.error("Stripe payment error:", error)
    toast.error(error || "Payment failed. Please try again.")
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="credit" onValueChange={setPaymentMethod}>
          <TabsList className="w-full mb-4 grid grid-cols-2">
            <TabsTrigger value="credit" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" /> Credit Card
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1">
              <Wallet className="h-4 w-4 mr-2" /> Savings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit" className="space-y-4">
            {/* Stripe Card Form */}
            <Elements stripe={stripePromise}>
              <StripeCheckoutForm
                amount={totalAmount}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
              />
            </Elements>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              {applySavingsDiscount && (
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium text-sm">
                    5% Savings Discount Applied!
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span>Available Balance:</span>
                <span className="font-semibold">{formatTZS(userBalance)}</span>
              </div>
              {applySavingsDiscount && (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span>Original Price:</span>
                    <span className="line-through text-gray-500">
                      {formatTZS(totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span>Discount (5%):</span>
                    <span className="text-green-600">
                      -{formatTZS(savingsDiscount)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center font-semibold">
                <span>You Pay:</span>
                <span className="text-green-600">
                  {formatTZS(applySavingsDiscount ? discountedPrice : totalAmount)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-medium">
                <span>Remaining Balance:</span>
                <span
                  className={
                    userBalance >= (applySavingsDiscount ? discountedPrice : totalAmount)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {formatTZS(userBalance - (applySavingsDiscount ? discountedPrice : totalAmount))}
                </span>
              </div>
              {userBalance < (applySavingsDiscount ? discountedPrice : totalAmount) && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient funds in your savings account. Please choose
                    another payment method or top up your balance.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {paymentMethod === "savings" && (
            <Button
              onClick={processSavingsPayment}
              disabled={
                (paymentMethod === "savings" && userBalance < (applySavingsDiscount ? discountedPrice : totalAmount)) ||
                !paymentMethod ||
                isProcessing
              }
            >
              {isProcessing ? "Processing..." : `Pay ${formatTZS(applySavingsDiscount ? discountedPrice : totalAmount)}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}