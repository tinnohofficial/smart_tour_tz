'use client'

import React, { useState, useEffect } from 'react'
import CartComponent from '../../components/CartComponent'
import { useCartStore } from '../store/cartStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EnhancedPaymentDialog } from '@/app/components/enhanced-payment-dialog'

export default function CartPage() {
  const router = useRouter()
  const { checkoutCart, getCartTotal } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [enhancedPaymentOpen, setEnhancedPaymentOpen] = useState(false)

  // Check if user is logged in and is a tourist
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }
    
    const user = JSON.parse(userData)
    if (user.role !== 'tourist') {
      router.push('/login')
      return
    }
  }, [router])

  const handleCheckout = async (paymentMethod) => {
    setIsProcessing(true)
    
    try {
      const paymentData = {
        paymentMethod
      }

      // For crypto payments, you might want to add wallet signature
      if (paymentMethod === 'crypto') {
        // Add wallet integration here
        paymentData.walletSignature = 'wallet_signature_here'
      }

      await checkoutCart(paymentData)
      
      // Redirect to bookings page on success
      router.push('/my-bookings')
      
    } catch (error) {
      // Error is handled in store
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnhancedPaymentSuccess = async (paymentResult) => {
    try {
      toast.success('Cart checkout completed successfully!')
      setEnhancedPaymentOpen(false)
      router.push('/my-bookings')
    } catch (error) {
      console.error('Error handling payment success:', error)
      toast.error('Error processing checkout confirmation')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            Review your selected destinations and complete your booking
          </p>
        </div>
        
        <CartComponent 
          onCheckout={handleCheckout}
          isProcessing={isProcessing}
          onEnhancedCheckout={() => setEnhancedPaymentOpen(true)}
        />

        <EnhancedPaymentDialog
          isOpen={enhancedPaymentOpen}
          onClose={() => setEnhancedPaymentOpen(false)}
          amount={getCartTotal()}
          onPaymentSuccess={handleEnhancedPaymentSuccess}
          cartId={true}
        />
      </div>
    </div>
  )
}