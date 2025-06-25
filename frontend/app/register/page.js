"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { ChevronRight, UserPlus } from "lucide-react";
import { useRegisterStore } from "./registerStore";
import { publishAuthChange } from "@/components/Navbar";
import ReCAPTCHA from "react-google-recaptcha";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export default function Register() {
  const router = useRouter();
  const { basicFormData, setRole, setBasicFormData } = useRegisterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Extract form values from store
  const {
    email,
    password,
    confirmPassword,
    phoneNumber,
    role: selectedRole,
  } = basicFormData;

  // Check if user is already logged in
  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();

    if (token && userData) {
      const user = userData;

      // Redirect based on role
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "tour_guide":
          router.push("/tour-guide/dashboard");
          break;
        case "travel_agent":
          router.push("/travel-agent/dashboard");
          break;
        case "hotel_manager":
          router.push("/hotel-manager/dashboard");
          break;
        default:
          // Default case for tourists
          router.push("/");
          break;
      }
    }
  }, [router]);

  const onBasicSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const email = basicFormData.email;
    const password = basicFormData.password;
    const confirmPassword = basicFormData.confirmPassword;
    const phoneNumber = basicFormData.phoneNumber;
    const selectedRole = basicFormData.role;

    if (
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !selectedRole
    ) {
      toast.error("Please fill in all fields.");
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
      setIsLoading(false);
      return;
    }

    // Basic presence check only - detailed validation is handled by backend
    if (!phoneNumber) {
      toast.error("Please enter a phone number.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/register`, {
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
          toast.error(
            firstError.msg || firstError.message || "Validation failed.",
          );
        } else {
          toast.error(data.message || "Registration failed.");
        }
        setIsLoading(false);
        return;
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        toast.success(
          "Registration successful! Please check your email to verify your account.",
        );

        // Redirect to check email page with user's email
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Legacy flow for cases where email verification is not required
      // Store the token and user data
      localStorage.setItem("token", data.token);

      toast.success("Registration successful!");

      // Store user data from the response
      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
      };

      localStorage.setItem("userData", JSON.stringify(userData));

      // Set login timestamp to prevent immediate token verification
      localStorage.setItem("loginTimestamp", new Date().getTime().toString());

      // Notify about authentication change
      publishAuthChange();

      // Set role in store and redirect based on role and status
      setRole(selectedRole);
      if (selectedRole === "tourist") {
        // Tourists are immediately active and go to homepage
        router.push("/");
      } else {
        // For other roles, check their status and redirect accordingly
        const userStatus = data.user.status;

        if (userStatus === "pending_profile") {
          // New users need to complete their profile first
          const profileCompletionPath = {
            tour_guide: "/tour-guide/complete-profile",
            hotel_manager: "/hotel-manager/complete-profile",
            travel_agent: "/travel-agent/complete-profile",
          }[selectedRole];

          if (profileCompletionPath) {
            router.push(profileCompletionPath);
          } else {
            // Fallback to dashboard
            router.push(`/${selectedRole.replace("_", "-")}/dashboard`);
          }
        } else {
          // For other statuses, go to dashboard
          const dashboardPath = {
            tour_guide: "/tour-guide/dashboard",
            hotel_manager: "/hotel-manager/dashboard",
            travel_agent: "/travel-agent/dashboard",
          }[selectedRole];

          router.push(dashboardPath || "/");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
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
                <UserPlus className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-semibold">Smart Tour Tanzania</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              JOIN US TODAY
            </h1>
            <div className="w-12 h-1 bg-white mb-6"></div>
            <p className="text-lg leading-relaxed opacity-90 max-w-md">
              Create your account to start your Tanzania adventure. Whether you're a tourist, 
              tour guide, hotel manager, or travel agent - we have the perfect platform for you.
            </p>
          </div>
          <div className="text-md opacity-75">
            Start Your Journey with Smart Tour Tanzania
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-amber-50/30 min-h-screen">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-amber-900 mb-2">Create Account</h2>
              <p className="text-amber-700">Please fill in your details to get started</p>
            </div>

            <form onSubmit={onBasicSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-amber-800 mb-2">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={basicFormData.email}
                  onChange={(e) => setBasicFormData({ email: e.target.value })}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-amber-800 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    placeholder="Enter password"
                    value={basicFormData.password}
                    onChange={(e) => setBasicFormData({ password: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-800 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm password"
                    value={basicFormData.confirmPassword}
                    onChange={(e) => setBasicFormData({ confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-amber-800 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  value={basicFormData.phoneNumber}
                  onChange={(value) => setBasicFormData({ phoneNumber: value || "" })}
                  defaultCountry="TZ"
                  placeholder="744 117 544"
                  international
                  withCountryCallingCode
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-amber-800 mb-2">
                  Role
                </label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setBasicFormData({ role: value })}
                  defaultValue={selectedRole}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tourist">Tourist</SelectItem>
                    <SelectItem value="tour_guide">Tour Guide</SelectItem>
                    <SelectItem value="hotel_manager">Hotel Manager</SelectItem>
                    <SelectItem value="travel_agent">Travel Agent</SelectItem>
                  </SelectContent>
                </Select>
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
                className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  "CREATING ACCOUNT..."
                ) : (
                  <>
                    CREATE ACCOUNT
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-amber-700">
                Already have an account?{" "}
                <a href="/login" className="text-amber-600 hover:text-amber-500 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
