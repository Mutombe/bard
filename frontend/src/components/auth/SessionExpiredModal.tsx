"use client";

/**
 * SessionExpiredModal
 *
 * Listens site-wide for the `auth:session-expired` custom event that
 * the axios interceptors dispatch when the refresh token is rejected.
 * Displays a focused modal so users see exactly why they're suddenly
 * signed out (instead of watching random images/articles fail to load
 * — the silent symptom we kept hearing about) and gets them back into
 * the app with a single click.
 *
 * Auto-logout is already performed by the interceptor
 * (`frontend/src/services/api/client.ts` → `clearAuth()` +
 * localStorage wipe). This component is purely the visible feedback
 * layer + re-login CTA.
 */

import { useEffect, useState } from "react";
import { WarningCircle, X } from "@phosphor-icons/react";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAppSelector } from "@/store";

export function SessionExpiredModal() {
  const [show, setShow] = useState(false);
  const { openLogin } = useAuthModal();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    const onExpired = () => setShow(true);
    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, []);

  // If the user re-authenticates via the login modal, clear our modal too.
  // (Once `isAuthenticated` flips true, the session is back.)
  useEffect(() => {
    if (show && isAuthenticated) setShow(false);
  }, [show, isAuthenticated]);

  if (!show) return null;

  const handleSignIn = () => {
    setShow(false);
    openLogin();
  };

  const handleDismiss = () => {
    // Let the user keep browsing as a guest. Public pages still work —
    // we've already wiped the stale tokens, so subsequent requests go
    // out anonymously.
    setShow(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md bg-card border border-terminal-border rounded-lg shadow-2xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
            <WarningCircle className="h-5 w-5 text-amber-500" weight="fill" />
          </div>
          <div className="flex-1">
            <h2
              id="session-expired-title"
              className="text-lg font-semibold text-foreground mb-1"
            >
              Session expired
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You&apos;ve been signed out for security after a period of
              inactivity. Sign in again to access your saved articles,
              watchlist, and personalized feed.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors"
          >
            Continue as guest
          </button>
          <button
            onClick={handleSignIn}
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            autoFocus
          >
            Sign in again
          </button>
        </div>
      </div>
    </div>
  );
}
