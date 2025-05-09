"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { usePasswordStore } from "./store"
import { useEffect } from "react"

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL

// Password change schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/.*[!@#$%^&*(),.?":{}|<>].*/, { message: "Password must contain at least one special character" }),
    confirmPassword: z.string().min(8, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })

export default function ChangePassword() {
  const {
    isSubmitting,
    success,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    setIsSubmitting,
    setSuccess,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    resetState
  } = usePasswordStore()

  // Reset state when component is unmounted
  useEffect(() => {
    return () => resetState()
  }, [resetState])

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSuccess(false)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("Authentication error", {
          description: "You must be logged in to change your password"
        })
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`${API_URL}/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update password")
      }

      setSuccess(true)
      form.reset()

      toast.success("Password updated successfully!", {
        description: "Your password has been changed. Please use your new password the next time you log in."
      })
    } catch (error) {
      toast.error("Error updating password", {
        description: error.message || "There was an error updating your password. Please check your current password and try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-xl mx-auto py-10">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Password Security</h1>
            <p className="text-blue-100 mt-1">Keep your account protected with a strong password</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {success && (
        <Alert className="mb-8 bg-green-50 border-green-200 shadow-md">
          <div className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
            <div>
              <AlertTitle className="text-green-800 font-semibold text-lg">Password Successfully Updated</AlertTitle>
              <AlertDescription className="text-green-700">
                Your password has been updated securely. Remember to use your new password for your next login.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card className="border-0 shadow-xl overflow-hidden py-0">
        <CardHeader className="bg-gradient-to-br from-gray-50 to-gray-100 border-b p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">Update Your Password</CardTitle>
              <CardDescription className="text-gray-600">Strengthen your account security with a new password</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Current Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-4 w-4 transition-colors duration-200" />
                          <Input 
                            type={showCurrentPassword ? "text" : "password"} 
                            className="pl-10 pr-10 py-5 border-gray-300 focus:border-blue-400 rounded-md shadow-sm transition-all duration-200" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-blue-600"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <div className="pt-2 pb-1">
                  <div className="border-t border-gray-200"></div>
                </div>

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-4 w-4 transition-colors duration-200" />
                          <Input 
                            type={showNewPassword ? "text" : "password"} 
                            className="pl-10 pr-10 py-5 border-gray-300 focus:border-blue-400 rounded-md shadow-sm transition-all duration-200" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-blue-600"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Password must include:</h4>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <li className="flex items-center text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            At least 8 characters
                          </li>
                          <li className="flex items-center text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            Uppercase letters (A-Z)
                          </li>
                          <li className="flex items-center text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            Lowercase letters (a-z)
                          </li>
                          <li className="flex items-center text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            Numbers (0-9)
                          </li>
                          <li className="flex items-center text-xs text-gray-600 col-span-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                            Special characters (e.g., !@#$%^&*)
                          </li>
                        </ul>
                      </div>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-4 w-4 transition-colors duration-200" />
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            className="pl-10 pr-10 py-5 border-gray-300 focus:border-blue-400 rounded-md shadow-sm transition-all duration-200" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-blue-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-medium transition-all duration-200 shadow-md hover:shadow-lg" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-8 py-4">
          <div className="w-full flex items-center gap-3 text-sm text-gray-600">
            <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <p>For your security, you will need to log in again after changing your password</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
