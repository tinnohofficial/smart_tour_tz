"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneInput } from "@/components/ui/phone-input"
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
  
const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      const user = JSON.parse(userData)
      
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          router.push("/admin/dashboard")
          break;
        case 'tour_guide':
          router.push("/tour-guide/dashboard")
          break;
        case 'travel_agent':
          router.push("/travel-agent/dashboard")
          break;
        case 'hotel_manager':
          router.push("/hotel-manager/dashboard")
          break;
        default:
          // Default case for tourists
          router.push("/")
          break;
      }
    }
  }, [router])

  const onBasicSubmit = async (event) => {
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

    // if (!/[A-Z]/.test(password)) {
    //   toast.error("Password must contain at least one uppercase letter.");
    //   return;
    // }

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

    // Basic presence check only - detailed validation is handled by backend
    if (!phoneNumber) {
      toast.error("Please enter a phone number.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          phone_number: phoneNumber, 
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          // Show the first validation error message
          const firstError = data.errors[0];
          toast.error(firstError.msg || firstError.message || "Validation failed.");
        } else {
          toast.error(data.message || "Registration failed.");
        }
        return;
      }

      // Store the token and user data
      localStorage.setItem('token', data.token);
      
      toast.success("Registration successful!");

      // Set role in store and redirect based on role
      setRole(selectedRole);
      if (selectedRole === "tourist") {
        router.push("/locations");
      } else {
        // For other roles that need profile completion
        const profilePath = {
          "tour_guide": "/tour-guide/dashboard",
          "hotel_manager": "/hotel-manager/dashboard",
          "travel_agent": "/travel-agent/dashboard",
        }[selectedRole];
        
        if (profilePath) {
          router.push(profilePath);
        } else {
          router.push("/locations");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Card className="border-amber-100 shadow-md">
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
                  <PhoneInput
                    value={basicFormData.phoneNumber}
                    onChange={(value) => setBasicFormData({ phoneNumber: value || '' })}
                    defaultCountry="TZ"
                    placeholder="744 117 544"
                    international
                    withCountryCallingCode
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
                      <SelectItem value="tour_guide">Tour Guide</SelectItem>
                      <SelectItem value="hotel_manager">Hotel Manager</SelectItem>
                      <SelectItem value="travel_agent">Travel Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select your role in the system. Additional information may be required.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full text-white bg-amber-700 hover:bg-amber-800">
                Create Account
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
           
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-amber-700 hover:underline">
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}