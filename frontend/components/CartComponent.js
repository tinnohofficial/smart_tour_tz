'use client'

import React, { useEffect } from 'react'
import { useCartStore } from '../app/store/cartStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Trash2, ShoppingCart, CreditCard, Wallet } from 'lucide-react'
import { toast } from 'sonner'

const CartComponent = ({ onCheckout }) => {
  const {
    cart,
    isLoading,
    error,
    fetchCart,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal
  } = useCartStore()

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleRemoveItem = async (bookingId) => {
    try {
      await removeFromCart(bookingId)
    } catch (error) {
      // Error is handled in store
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
    } catch (error) {
      // Error is handled in store
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ShoppingCart className="h-5 w-5" />
            Cart Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchCart} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const itemCount = getCartItemCount()
  const total = getCartTotal()

  if (itemCount === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
          </CardTitle>
          <CardDescription>Your cart is empty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You haven't added any destinations to your cart yet.</p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Destinations
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({itemCount} {itemCount === 1 ? 'destination' : 'destinations'})
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear Cart
          </Button>
        </CardTitle>
        <CardDescription>
          Review your selected destinations and proceed to checkout
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.bookings?.map((booking) => (
            <Card key={booking.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {booking.destination_name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Start Date:</span> {formatDate(booking.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">End Date:</span> {formatDate(booking.end_date)}
                      </div>
                    </div>
                    
                    {/* Booking Items */}
                    <div className="space-y-2 mb-3">
                      {booking.items?.map((item, index) => (
                        <div key={`${booking.id}-${item.item_type}-${item.id || index}`} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {item.item_type}
                            </Badge>
                            <span className="text-sm">{item.item_name || 'Service'}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(item.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">{formatCurrency(booking.total_cost)}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveItem(booking.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="border-t pt-4 mt-6">
          <div className="flex items-center justify-between text-lg font-semibold mb-4">
            <span>Grand Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => onCheckout?.('savings')} 
              className="flex-1"
              variant="outline"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Pay with Savings
            </Button>
            <Button 
              onClick={() => onCheckout?.('stripe')} 
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay with Card
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CartComponent
