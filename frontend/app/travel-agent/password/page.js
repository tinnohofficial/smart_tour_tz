"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function TravelAgentChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("All fields are required")
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("You must be logged in to change your password")
        return
      }

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to change password")
      }

      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      toast.success("Password changed successfully")
    } catch (error) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Change Password</h1>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <Lock className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle>Update Your Password</CardTitle>
          </div>
          <CardDescription>
            Ensure your account is secure by using a strong password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-center text-sm text-gray-500">
          <p>
            Password must be at least 6 characters and include mixed characters for better security
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}