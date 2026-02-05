"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bell,
  Search,
  ChevronRight,
  LogIn,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuthModal } from "@/contexts/AuthModalContext";
import type { Company } from "@/types";

// Helper function to get currency symbol
function getCurrencySymbol(exchangeCode?: string): string {
  const currencies: Record<string, string> = {
    "JSE": "R",
    "ZSE": "ZiG",
    "VFEX": "$",
    "BSE": "P",
    "NSE": "₦",
    "NGX": "₦",
    "EGX": "E£",
    "GSE": "₵",
  };
  return currencies[exchangeCode || "JSE"] || "R";
}

export default function WatchlistPage() {
  const {
    items,
    isLoading,
    isAuthenticated,
    isInWatchlist,
    removeCompany,
  } = useWatchlist();
  const { openLogin } = useAuthModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState<Record<string, boolean>>({});

  const toggleAlert = (companyId: string) => {
    setAlerts((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const handleRemove = async (companyId: string) => {
    await removeCompany(companyId);
  };

  // Filter items by search query
  const filteredItems = items.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const gainers = items.filter(
    (item) => (item.price_change_percent || 0) > 0
  ).length;
  const alertsCount = Object.values(alerts).filter(Boolean).length;

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Star className="h-6 w-6 text-brand-orange" />
              Watchlist
            </h1>
            <p className="text-muted-foreground">
              Track your favorite stocks and receive alerts on price movements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search watchlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange w-48"
              />
            </div>
            <Link
              href="/companies"
              className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Stock
            </Link>
          </div>
        </div>

        {/* Guest user banner */}
        {!isAuthenticated && items.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">
                Your watchlist is saved locally.{" "}
                <button onClick={openLogin} className="text-brand-orange hover:underline font-medium">
                  Sign in
                </button>{" "}
                to sync across devices and never lose your data.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <div className="animate-pulse">
              <div className="h-12 w-12 bg-terminal-bg-elevated rounded-full mx-auto mb-4" />
              <div className="h-4 w-32 bg-terminal-bg-elevated rounded mx-auto mb-2" />
              <div className="h-3 w-48 bg-terminal-bg-elevated rounded mx-auto" />
            </div>
          </div>
        )}

        {/* Watchlist Table */}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
              <div className="col-span-4">Stock</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Change</div>
              <div className="col-span-2 text-center">Alert</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-terminal-border">
              {filteredItems.map((item) => {
                const change = parseFloat(String(item.price_change || 0));
                const changePercent = parseFloat(String(item.price_change_percent || 0));
                const isUp = changePercent >= 0;
                const currency = getCurrencySymbol(item.exchange?.code);
                const hasAlert = alerts[item.id] || false;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
                  >
                    <div className="col-span-4">
                      <Link
                        href={`/companies/${item.symbol.toLowerCase()}`}
                        className="hover:text-brand-orange transition-colors"
                      >
                        <div className="font-mono font-semibold">{item.symbol}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.exchange?.code || "JSE"}
                        </div>
                      </Link>
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {currency}{Number(item.current_price || 0).toFixed(2)}
                    </div>
                    <div
                      className={cn(
                        "col-span-2 text-right flex items-center justify-end gap-1",
                        isUp ? "text-market-up" : "text-market-down"
                      )}
                    >
                      {isUp ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-mono">
                        {isUp ? "+" : ""}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleAlert(item.id)}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          hasAlert
                            ? "bg-brand-orange/20 text-brand-orange"
                            : "text-muted-foreground hover:bg-terminal-bg-elevated"
                        )}
                        title={hasAlert ? "Alert set" : "Set price alert"}
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Link
                        href={`/companies/${item.symbol.toLowerCase()}`}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated rounded-md transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded-md transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !isLoading && items.length === 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding stocks to track their performance and receive alerts.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                Browse Companies
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={openLogin}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        ) : !isLoading && filteredItems.length === 0 ? (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              No stocks match &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : null}

        {/* Quick Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Stocks</div>
              <div className="text-2xl font-bold">{items.length}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Gainers</div>
              <div className="text-2xl font-bold text-market-up">{gainers}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Active Alerts</div>
              <div className="text-2xl font-bold text-brand-orange">{alertsCount}</div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
