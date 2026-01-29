"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";

type VerificationStatus = "loading" | "success" | "already_verified" | "error";

export default function NewsletterVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [newsletterType, setNewsletterType] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided");
      return;
    }

    const verifySubscription = async () => {
      try {
        const response = await apiClient.post("/engagement/subscriptions/verify/", { token });
        if (response.data.message === "Email already verified") {
          setStatus("already_verified");
        } else {
          setStatus("success");
        }
        setNewsletterType(response.data.newsletter_type || "");
      } catch (err: any) {
        setStatus("error");
        setError(err.response?.data?.error || "Failed to verify subscription");
      }
    };

    verifySubscription();
  }, [token]);

  const formatNewsletterType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-brand-orange mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your subscription.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-market-up mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">
                Your subscription to{" "}
                {newsletterType && (
                  <span className="text-brand-orange font-medium">
                    {formatNewsletterType(newsletterType)}
                  </span>
                )}{" "}
                has been confirmed.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll start receiving our newsletter at your email address.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {status === "already_verified" && (
            <>
              <Mail className="h-16 w-16 text-blue-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Already Verified</h1>
              <p className="text-muted-foreground mb-6">
                Your email has already been verified. You're all set to receive our newsletters!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-market-down mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">
                {error || "We couldn't verify your subscription. The link may be invalid or expired."}
              </p>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-terminal-bg border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
