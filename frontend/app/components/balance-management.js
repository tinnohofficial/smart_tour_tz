"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, PiggyBank } from "lucide-react"
import { toast } from "sonner"
import { formatTZS } from "@/app/utils/currency"
export function BalanceManagement() {
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(0)
  const [newBalance, setNewBalance] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("userData")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      if (parsedUser.role === 'tourist') {
        fetchBalance()
      }
    }
  }, [])

  const fetchBalance = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/auth/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance || 0)
      } else {
        toast.error("Failed to fetch balance")
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      toast.error("Error fetching balance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBalance = async (e) => {
    e.preventDefault()
    
    if (!newBalance || isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0) {
      toast.error("Please enter a valid balance amount (must be non-negative)")
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const response = await fetch('/api/auth/balance', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: parseFloat(newBalance) })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Balance updated successfully!")
        setBalance(data.balance)
        setNewBalance("")
      } else {
        toast.error(data.message || "Failed to update balance")
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
      toast.error("Error updating balance")
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user || user.role !== 'tourist') {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-green-600" />
          Balance Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance Display */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-green-800">Current Balance</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {isLoading ? "Loading..." : isVisible ? formatTZS(balance) : "••••••"}
          </div>
        </div>

        {/* Update Balance Form */}
        <form onSubmit={handleUpdateBalance} className="space-y-4">
          <div>
            <Label htmlFor="newBalance" className="text-sm font-medium">
              Update Balance (TZS)
            </Label>
            <Input
              id="newBalance"
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Enter new balance amount"
              className="mt-1"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isUpdating || !newBalance}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? "Updating..." : "Update Balance"}
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600 text-center">
            Your balance is used for booking payments
          </p>
        </div>
      </CardContent>
    </Card>
  )
}