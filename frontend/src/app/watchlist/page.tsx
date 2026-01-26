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
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAppSelector } from "@/store";

interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  alertSet: boolean;
}

const mockWatchlist: WatchlistItem[] = [
  { symbol: "NPN", name: "Naspers Ltd", exchange: "JSE", price: 3245.67, change: 89.34, changePercent: 2.83, alertSet: true },
  { symbol: "MTN", name: "MTN Group Ltd", exchange: "JSE", price: 156.78, change: 9.45, changePercent: 6.41, alertSet: false },
  { symbol: "AGL", name: "Anglo American Plc", exchange: "JSE", price: 567.34, change: 45.67, changePercent: 8.75, alertSet: true },
  { symbol: "SBK", name: "Standard Bank Group", exchange: "JSE", price: 189.45, change: 8.67, changePercent: 4.80, alertSet: false },
  { symbol: "DANGCEM", name: "Dangote Cement Plc", exchange: "NGX", price: 289.50, change: 4.50, changePercent: 1.58, alertSet: false },
];

export default function WatchlistPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [watchlist, setWatchlist] = useState(mockWatchlist);
  const [searchQuery, setSearchQuery] = useState("");

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter((item) => item.symbol !== symbol));
  };

  const toggleAlert = (symbol: string) => {
    setWatchlist(
      watchlist.map((item) =>
        item.symbol === symbol ? { ...item, alertSet: !item.alertSet } : item
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12">
          <div className="max-w-md mx-auto text-center">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Your Watchlist</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to track your favorite stocks and receive personalized alerts.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/subscribe"
                className="px-6 py-3 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

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
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors">
              <Plus className="h-4 w-4" />
              Add Stock
            </button>
          </div>
        </div>

        {/* Watchlist Table */}
        {watchlist.length > 0 ? (
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
              {watchlist
                .filter(
                  (item) =>
                    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => {
                  const isUp = item.change >= 0;

                  return (
                    <div
                      key={item.symbol}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-terminal-bg-elevated transition-colors items-center"
                    >
                      <div className="col-span-4">
                        <Link
                          href={`/companies/${item.symbol.toLowerCase()}`}
                          className="hover:text-brand-orange transition-colors"
                        >
                          <div className="font-mono font-semibold">{item.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.name}
                          </div>
                        </Link>
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {item.price.toFixed(2)}
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
                          {isUp ? "+" : ""}{item.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggleAlert(item.symbol)}
                          className={cn(
                            "p-2 rounded-md transition-colors",
                            item.alertSet
                              ? "bg-brand-orange/20 text-brand-orange"
                              : "text-muted-foreground hover:bg-terminal-bg-elevated"
                          )}
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
                          onClick={() => removeFromWatchlist(item.symbol)}
                          className="p-2 text-muted-foreground hover:text-market-down hover:bg-terminal-bg-elevated rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding stocks to track their performance and receive alerts.
            </p>
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Browse Companies
            </Link>
          </div>
        )}

        {/* Quick Stats */}
        {watchlist.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Stocks</div>
              <div className="text-2xl font-bold">{watchlist.length}</div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Gainers</div>
              <div className="text-2xl font-bold text-market-up">
                {watchlist.filter((item) => item.change > 0).length}
              </div>
            </div>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <div className="text-sm text-muted-foreground mb-1">Active Alerts</div>
              <div className="text-2xl font-bold text-brand-orange">
                {watchlist.filter((item) => item.alertSet).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
