"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { publishAuthChange } from "@/components/Navbar";
import { getAuthToken, getUserData, storeAuthData } from "../utils/auth";
import ReCAPTCHA from "react-google-recaptcha";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  // Local state instead of Zustand store for simple form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is already logged in - simplified to avoid conflicts
  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();

    // Only redirect if we have both token and userData and we're on login page
    if (token && userData && window.location.pathname === "/login") {
      const user = userData;

      // Use a simple redirect without complex logic
      if (user.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (user.role === "tour_guide") {
        window.location.href = "/tour-guide/dashboard";
      } else if (user.role === "travel_agent") {
        window.location.href = "/travel-agent/dashboard";
      } else if (user.role === "hotel_manager") {
        window.location.href = "/hotel-manager/dashboard";
      } else {
        window.location.href = "/";
      }
    }
  }, [router]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Email is required.");
      setIsLoading(false);
      return;
    }    if (!password) {
      toast.error("Password is required.");
      setIsLoading(false);
      return;
    }

    if (!captchaValue) {
      toast.error("Please complete the CAPTCHA verification.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/login`, {
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
        // Check if email verification is required
        if (data.requiresEmailVerification) {
          toast.error("Please verify your email address before logging in.");
          router.push(`/check-email?email=${encodeURIComponent(email)}`);
          setIsLoading(false);
          return;
        }

        toast.error(
          data.message || "Invalid email or password. Please try again.",
        );
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back to Smart Tour System.");

      // Store user data from the correct location in the response
      const userData = {
        id: data.user.id,
        email: data.user.email,
        phone_number: data.user.phone_number,
        role: data.user.role,
        status: data.user.status,
      };

      // Store authentication data based on remember me preference
      storeAuthData(data.token, userData, rememberMe);

      // Notify about authentication change
      publishAuthChange();

      // Check if there's a return URL from a previous redirect
      if (returnUrl && returnUrl !== "/") {
        router.push(returnUrl);
        return;
      }

      // Default role-based redirection using the correct user role
      const userRole = data.user.role;

      switch (userRole) {
        case "admin":
          router.replace("/admin/dashboard");
          break;
        case "tour_guide":
          router.replace("/tour-guide/dashboard");
          break;
        case "travel_agent":
          router.replace("/travel-agent/dashboard");
          break;
        case "hotel_manager":
          router.replace("/hotel-manager/dashboard");
          break;
        default:
          // Default case for tourists
          router.replace("/");
          break;
      }    } catch (error) {
      toast.error("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
      // Reset CAPTCHA on error
      setCaptchaValue(null);
    }
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500/20 rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-500/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-amber-400/15 rounded-full"></div>
        
        <div className="flex flex-col justify-center items-start p-12 text-white relative z-10 w-full">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <LogIn className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-semibold">Smart Tour Tanzania</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              WELCOME BACK
            </h1>
            <div className="w-12 h-1 bg-white mb-6"></div>
            <p className="text-lg leading-relaxed opacity-90 max-w-md">
              Sign in to access your personalized Tanzania travel dashboard. 
              Discover amazing destinations, book tours, and manage your adventures 
              from one central location.
            </p>
          </div>
          <div className="text-md opacity-75">
            Explore Destinations with Smart Tour Tanzania
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8  bg-amber-50/30 min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-amber-900 mb-2">Login Account</h2>
              <p className="text-amber-700">Please sign in to continue to the dashboard</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-amber-800 mb-2">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-amber-800 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-amber-800">
                    Remember me
                  </label>
                </div>
                <a href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-500">
                  Forgot password?
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Verify you're not a robot
                </label>
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  onExpired={() => setCaptchaValue(null)}
                  onError={() => setCaptchaValue(null)}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  "SIGNING IN..."
                ) : (
                  "SIGN IN"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-amber-700">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-amber-600 hover:text-amber-500 font-medium">
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
