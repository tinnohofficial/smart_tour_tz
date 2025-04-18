"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ChevronRight } from "lucide-react"
import { useRegisterStore } from "./registerStore"

export default function Register() {
  const router = useRouter()
  const {
    basicFormData,
    setRole,
    setBasicFormData,
  } = useRegisterStore();


  const onBasicSubmit = (event) => {
    event.preventDefault();

    const email = basicFormData.email;
    const password = basicFormData.password;
    const confirmPassword = basicFormData.confirmPassword;
    const phoneNumber = basicFormData.phoneNumber;
    const selectedRole = basicFormData.role;

    if (!email || !password || !confirmPassword || !phoneNumber || !selectedRole) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setRole(selectedRole);
    if (selectedRole === "tourist") {
      router.push("/dashboard")
    } else {
        router.push(`/dashboard?completeProfile=true&role=${selectedRole}`)
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          </div>
          <CardDescription className="text-gray-500">Enter your details to create your Smart Tour account</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={onBasicSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                  <Input
                    id="email"
                    placeholder="your.email@example.com"
                    value={basicFormData.email}
                    onChange={(e) => setBasicFormData({ email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    <Input
                      type="password"
                      id="password"
                      placeholder="••••••••"
                      value={basicFormData.password}
                      onChange={(e) => setBasicFormData({ password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      At least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password</label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={basicFormData.confirmPassword}
                      onChange={(e) => setBasicFormData({ confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone Number</label>
                  <Input
                    id="phoneNumber"
                    placeholder="+1 (555) 000-0000"
                    value={basicFormData.phoneNumber}
                    onChange={(e) => setBasicFormData({ phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
                  <Select onValueChange={(value) => setBasicFormData({ role: value })} defaultValue={basicFormData.role}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="tourist">Tourist</SelectItem>
                      <SelectItem value="tourGuide">Tour Guide</SelectItem>
                      <SelectItem value="hotelManager">Hotel Manager</SelectItem>
                      <SelectItem value="travelAgent">Travel Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select your role in the system. Additional information may be required.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700">
                Create Account
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
           
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}