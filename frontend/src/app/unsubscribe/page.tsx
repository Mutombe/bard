"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import apiClient from "@/services/api/client";

type UnsubscribeStatus = "loading" | "success" | "error";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No unsubscribe token provided");
      return;
    }

    const unsubscribe = async () => {
      try {
        await apiClient.post("/engagement/subscriptions/unsubscribe/", { token });
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setError(err.response?.data?.error || "Failed to unsubscribe");
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-brand-orange mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Processing...</h1>
              <p className="text-muted-foreground">Please wait while we process your request.</p>
            </>
          )}

          {status === "success" && (
            <>
              <MailX className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Unsubscribed</h1>
              <p className="text-muted-foreground mb-6">
                You have been successfully unsubscribed from our newsletter.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                We're sorry to see you go. You can always resubscribe from our website.
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
              <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
              <p className="text-muted-foreground mb-6">
                {error || "We couldn't process your unsubscribe request. The link may be invalid or expired."}
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-terminal-bg border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
              >
                Go to Homepage
              </Link>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
