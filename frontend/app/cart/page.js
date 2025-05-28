'use client'

import React, { useState, useEffect } from 'react'
import CartComponent from '../../components/CartComponent'
import { useCartStore } from '../../store/cartStore'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const router = useRouter()
  const { checkoutCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if user is logged in and is a tourist
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || user.role !== 'tourist') {
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
        />
      </div>
    </div>
  )
}
