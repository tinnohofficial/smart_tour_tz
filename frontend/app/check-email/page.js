"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Loader2, RefreshCw } from "lucide-react";

function CheckEmailContent() {
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const resendParam = searchParams.get("resend");
    const emailParam = searchParams.get("email");

    if (resendParam === "true") {
      setShowResendForm(true);
    }

    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setIsResending(true);

    if (!email) {
      toast.error("Email is required.");
      setIsResending(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setShowResendForm(false);
        setEmail("");
      } else {
        toast.error(data.message || "Failed to send verification email.");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  const handleGoToRegister = () => {
    router.push("/register");
  };

  return (
    <div className="container max-w-3xl mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Mail className="h-6 w-6 text-amber-700" />
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <Mail className="h-16 w-16 text-amber-700 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Verification Email Sent
              </h2>
              <div className="space-y-1">
                <p className="text-gray-600">
                  We've sent a verification link to your email address.
                </p>
                <p className="text-gray-600">
                  Please check your inbox and click the verification link to
                  activate your account.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">Important:</p>
              <ul className="text-sm text-amber-700 space-y-1 text-left">
                <li>
                  • Check your spam/junk folder if you don't see the email
                </li>
                <li>• The verification link will expire in 24 hours</li>
                <li>• You must verify your email before you can log in</li>
              </ul>
            </div>
          </div>

          {!showResendForm ? (
            <div className="space-y-3">
              <Button
                onClick={() => setShowResendForm(true)}
                variant="outline"
                className="text-amber-700 border-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Didn't receive the email?
              </Button>
              <div className="space-x-2">
                <Button
                  onClick={handleBackToLogin}
                  className="text-white bg-amber-700 hover:bg-amber-800"
                >
                  Back to Login
                </Button>
                <Button onClick={handleGoToRegister} variant="outline">
                  Register Different Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">
                  Resend Verification Email
                </h3>
                <form onSubmit={handleResendVerification} className="space-y-3">
                  <Input
                    type="email"
                    value={email}
                    placeholder="Enter your email address"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="space-x-2">
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="text-white bg-amber-700 hover:bg-amber-800"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Email
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowResendForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckEmail() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-3xl mx-auto py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
