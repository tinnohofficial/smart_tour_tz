"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!email) {
      toast.error("Email is required.")
      setIsLoading(false)
      return
    }
// i need api for this forgot password (for now it stays as this sample first)
    try {
      // TODO: Implement forgot password API endpoint
      // const response = await fetch("/api/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // })
      // const data = await response.json()
      // if (!response.ok) {
      //   toast.error(data.message || "Failed to send reset email.")
      // } else {
      //   toast.success("Password reset instructions sent to your email.")
      // }
      toast.error("Forgot password feature not yet implemented.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button type="submit" className="text-white bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}