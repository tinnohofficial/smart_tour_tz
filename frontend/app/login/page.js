"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { LogIn } from "lucide-react"
import { useLoginStore } from "./loginStore"
import { publishAuthChange } from "@/components/Navbar" // Import the publishAuthChange function

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || "/"
  const { email, password, isLoading, setEmail, setPassword, setIsLoading } = useLoginStore(); 

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Email is required.");
      setIsLoading(false);
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back to Smart Tour System.");

      // Store token and user data
      localStorage.setItem("token", data.token);
      
      // Store user data from the correct location in the response
      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status
      };
      
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Set login timestamp to prevent immediate token verification
      localStorage.setItem("loginTimestamp", new Date().getTime().toString());

      // Notify about authentication change
      publishAuthChange();

      // Check if there's a return URL from a previous redirect
      if (returnUrl && returnUrl !== '/') {
        router.push(returnUrl);
        return;
      }

      // Default role-based redirection using the correct user role
      const userRole = data.user.role;
      
      console.log("User role:", userRole);  // For debugging

      switch (userRole) {
        case 'admin':
          router.push("/admin/dashboard");
          break;
        case 'tour_guide':
          router.push("/tour-guide/dashboard");
          break;
        case 'travel_agent':
          router.push("/travel-agent/dashboard");
          break;
        case 'hotel_manager':
          router.push("/hotel-manager/dashboard");
          break;
        default:
          // Default case for tourists
          router.push("/");
          break;
      }
    } catch (error) {
      toast.error("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription className="text-gray-500">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input
                  id="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>


              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
                <Input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>


              <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-sm text-gray-500 text-center">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Create an account
            </a>
          </div>
          <div className="text-sm text-center">
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot your password?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}