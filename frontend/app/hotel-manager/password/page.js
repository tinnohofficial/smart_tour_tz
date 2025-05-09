"use client"

import { useEffect } from "react"
import { Lock, Shield, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePasswordStore } from "./store"
import { useState } from "react"

export default function HotelManagerPasswordChange() {
  const { 
    currentPassword, 
    newPassword, 
    confirmPassword, 
    isSubmitting, 
    error, 
    setCurrentPassword, 
    setNewPassword, 
    setConfirmPassword, 
    changePassword,
    resetForm
  } = usePasswordStore()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  // Reset form when component unmounts or initially loads
  useEffect(() => {
    resetForm()
    return () => resetForm()
  }, [resetForm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await changePassword()
    if (result) {
      setSuccess(true)
      setTimeout(() => {
        resetForm()
        setSuccess(false)
      }, 3000)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      {/* Page Header */}
      <div className="bg-blue-600 p-4 rounded-lg mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <Lock className="h-6 w-6 text-white mr-2" />
            <h1 className="text-xl font-bold text-white">Change Password</h1>
          </div>
          <p className="text-blue-100 text-sm">Update your login credentials</p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Update Your Password</CardTitle>
          <CardDescription>
            Choose a strong password to protect your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 mr-2" />
                <AlertDescription>Password changed successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 flex items-center">
                <Shield className="h-4 w-4 mr-1.5 text-gray-500" />
                Current Password
              </label>
              <div className="relative">
                <Input 
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10 border-gray-300 focus:border-blue-400"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="h-4 w-4 mr-1.5 text-gray-500" />
                New Password
              </label>
              <div className="relative">
                <Input 
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10 border-gray-300 focus:border-blue-400"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="h-4 w-4 mr-1.5 text-gray-500" />
                Confirm New Password
              </label>
              <div className="relative">
                <Input 
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 border-gray-300 focus:border-blue-400"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t pt-6">
            <Button 
              type="submit" 
              className="text-white bg-blue-600 hover:bg-blue-700" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}