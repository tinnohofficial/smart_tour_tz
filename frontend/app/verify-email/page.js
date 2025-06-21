"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending"); // pending, success, error
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmailToken(tokenParam);
    } else {
      setVerificationStatus("error");
      setMessage("Invalid verification link. No token provided.");
    }
  }, [searchParams]);

  const verifyEmailToken = async (verificationToken) => {
    setIsVerifying(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: verificationToken }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus("success");
        setMessage(data.message);
        toast.success("Email verified successfully!");
      } else {
        setVerificationStatus("error");
        setMessage(data.message || "Failed to verify email.");
        toast.error(data.message || "Failed to verify email.");
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setVerificationStatus("error");
      setMessage("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleRequestNewLink = () => {
    router.push("/check-email?resend=true");
  };

  return (
    <div className="container max-w-3xl mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {isVerifying && <Loader2 className="h-6 w-6 animate-spin" />}
            {verificationStatus === "success" && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {verificationStatus === "error" && (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isVerifying && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-700" />
              <p className="text-gray-600">Verifying your email address...</p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-green-800">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  You can now log in to your Smart Tour Tanzania account.
                </p>
              </div>
              <Button
                onClick={handleGoToLogin}
                className="text-white bg-amber-700 hover:bg-amber-800"
              >
                Go to Login
              </Button>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-red-800">
                  Verification Failed
                </h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  The verification link may have expired or is invalid.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleRequestNewLink}
                  className="text-white bg-amber-700 hover:bg-amber-800"
                >
                  Request New Verification Link
                </Button>
                <Button
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="ml-2"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmail() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
