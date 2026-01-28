"use client";

import { useState } from "react";
import { Star, Bell, Share2, Check, Copy, Link2, Twitter, Facebook, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAppSelector } from "@/store";
import { useAuthModal } from "@/contexts/AuthModalContext";
import type { Company } from "@/types";

interface StockActionsProps {
  company: Company;
  className?: string;
  variant?: "default" | "compact";
}

export function StockActions({ company, className, variant = "default" }: StockActionsProps) {
  const { isInWatchlist, toggleCompany } = useWatchlist();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [alertSet, setAlertSet] = useState(false);
  const [copied, setCopied] = useState(false);

  const isWatched = isInWatchlist(company.id);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/companies/${company.symbol.toLowerCase()}`
    : "";

  const handleWatchlistToggle = async () => {
    await toggleCompany(company);
  };

  const handleNotify = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setShowAlertModal(true);
  };

  const handleSetAlert = () => {
    // In a real app, this would call an API to set the alert
    console.log(`Setting price alert for ${company.symbol}: ${alertType} ${alertPrice}`);
    setAlertSet(true);
    setTimeout(() => {
      setShowAlertModal(false);
      setAlertSet(false);
    }, 1500);
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareToTwitter = () => {
    const text = `Check out ${company.name} (${company.symbol}) on Bardiq Journal`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const isCompact = variant === "compact";

  return (
    <div className={cn("flex items-center gap-2 relative", className)}>
      {/* Watchlist Button */}
      <button
        onClick={handleWatchlistToggle}
        className={cn(
          "p-2 border rounded-md transition-colors",
          isWatched
            ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
            : "border-terminal-border hover:bg-terminal-bg-elevated"
        )}
        title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
      >
        <Star className={cn("h-5 w-5", isWatched && "fill-current")} />
      </button>

      {/* Notify/Alert Button */}
      <button
        onClick={handleNotify}
        className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
        title="Set Price Alert"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={handleShare}
          className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
          title="Share"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Share Menu Dropdown */}
        {showShareMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-terminal-bg border border-terminal-border rounded-lg shadow-xl overflow-hidden">
              <div className="p-3 border-b border-terminal-border">
                <div className="text-sm font-medium mb-1">Share {company.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">{company.name}</div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-market-up" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Share on X
                </button>

                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  Share on Facebook
                </button>

                <button
                  onClick={shareToLinkedIn}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  Share on LinkedIn
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Price Alert Modal */}
      {showAlertModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70"
            onClick={() => setShowAlertModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-terminal-bg border border-terminal-border rounded-lg shadow-xl">
            <div className="p-4 border-b border-terminal-border">
              <h3 className="font-semibold">Set Price Alert</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when {company.symbol} reaches your target price
              </p>
            </div>

            <div className="p-4 space-y-4">
              {alertSet ? (
                <div className="text-center py-4">
                  <Check className="h-12 w-12 text-market-up mx-auto mb-2" />
                  <p className="font-medium">Alert Set!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll be notified when {company.symbol} goes {alertType} {alertPrice}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Alert Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAlertType("above")}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                          alertType === "above"
                            ? "bg-market-up text-white"
                            : "bg-terminal-bg-elevated text-muted-foreground"
                        )}
                      >
                        Price Above
                      </button>
                      <button
                        onClick={() => setAlertType("below")}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                          alertType === "below"
                            ? "bg-market-down text-white"
                            : "bg-terminal-bg-elevated text-muted-foreground"
                        )}
                      >
                        Price Below
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {company.exchange?.currency || "R"}
                      </span>
                      <input
                        type="number"
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        placeholder={String(company.current_price || 0)}
                        className="w-full pl-8 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current price: {company.exchange?.currency || "R"}{Number(company.current_price || 0).toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleSetAlert}
                    disabled={!alertPrice}
                    className="w-full py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Alert
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Simpler version for indices (no watchlist, just notify and share)
interface IndexActionsProps {
  index: {
    code: string;
    name: string;
  };
  className?: string;
}

export function IndexActions({ index, className }: IndexActionsProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { openLogin } = useAuthModal();

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertValue, setAlertValue] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [alertSet, setAlertSet] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/markets/indices/${index.code.toLowerCase()}`
    : "";

  const handleNotify = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setShowAlertModal(true);
  };

  const handleSetAlert = () => {
    console.log(`Setting index alert for ${index.code}: ${alertType} ${alertValue}`);
    setAlertSet(true);
    setTimeout(() => {
      setShowAlertModal(false);
      setAlertSet(false);
    }, 1500);
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareToTwitter = () => {
    const text = `Check out ${index.name} (${index.code}) on Bardiq Journal`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div className={cn("flex items-center gap-2 relative", className)}>
      {/* Notify/Alert Button */}
      <button
        onClick={handleNotify}
        className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
        title="Set Index Alert"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={handleShare}
          className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
          title="Share"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Share Menu Dropdown */}
        {showShareMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-terminal-bg border border-terminal-border rounded-lg shadow-xl overflow-hidden">
              <div className="p-3 border-b border-terminal-border">
                <div className="text-sm font-medium mb-1">Share {index.code}</div>
                <div className="text-xs text-muted-foreground truncate">{index.name}</div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-market-up" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Share on X
                </button>

                <button
                  onClick={shareToFacebook}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  Share on Facebook
                </button>

                <button
                  onClick={shareToLinkedIn}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-terminal-bg-elevated rounded-md transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  Share on LinkedIn
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Index Alert Modal */}
      {showAlertModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70"
            onClick={() => setShowAlertModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-terminal-bg border border-terminal-border rounded-lg shadow-xl">
            <div className="p-4 border-b border-terminal-border">
              <h3 className="font-semibold">Set Index Alert</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when {index.code} reaches your target value
              </p>
            </div>

            <div className="p-4 space-y-4">
              {alertSet ? (
                <div className="text-center py-4">
                  <Check className="h-12 w-12 text-market-up mx-auto mb-2" />
                  <p className="font-medium">Alert Set!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll be notified when {index.code} goes {alertType} {alertValue}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Alert Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAlertType("above")}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                          alertType === "above"
                            ? "bg-market-up text-white"
                            : "bg-terminal-bg-elevated text-muted-foreground"
                        )}
                      >
                        Value Above
                      </button>
                      <button
                        onClick={() => setAlertType("below")}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                          alertType === "below"
                            ? "bg-market-down text-white"
                            : "bg-terminal-bg-elevated text-muted-foreground"
                        )}
                      >
                        Value Below
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Value</label>
                    <input
                      type="number"
                      value={alertValue}
                      onChange={(e) => setAlertValue(e.target.value)}
                      placeholder="Enter target value"
                      className="w-full px-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <button
                    onClick={handleSetAlert}
                    disabled={!alertValue}
                    className="w-full py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Alert
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
