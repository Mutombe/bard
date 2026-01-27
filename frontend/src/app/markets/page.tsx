"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Search,
  ChevronRight,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/loading";
import {
  useIndices,
  useGainers,
  useLosers,
  useMostActive,
  useExchanges,
} from "@/hooks";

const exchangeTabs = [
  { id: "all", label: "All Markets" },
  { id: "JSE", label: "JSE" },
  { id: "NGX", label: "NGX" },
  { id: "ZSE", label: "ZSE" },
  { id: "BSE", label: "BSE" },
];

// Skeleton Components
function IndexCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-4 w-32 mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

function StockRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="flex-1">
        <Skeleton className="h-5 w-16 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="text-right">
        <Skeleton className="h-5 w-16 mb-1" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="hidden md:block w-20">
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

function IndexCard({ index }: { index: any }) {
  const currentValue = Number(index.current_value) || 0;
  const previousClose = Number(index.previous_close) || currentValue;
  const change = Number(index.change) || (currentValue - previousClose);
  const changePercent = Number(index.change_percent) || (previousClose ? ((change / previousClose) * 100) : 0);
  const isUp = change >= 0;

  return (
    <Link
      href={`/markets/indices/${index.code?.toLowerCase() || index.symbol?.toLowerCase()}`}
      className="block p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-mono font-semibold">{index.code || index.symbol}</span>
          <span className="text-xs text-muted-foreground ml-2">{index.exchange?.code || index.exchange}</span>
        </div>
        <span className={cn(
          "px-2 py-0.5 text-xs font-semibold rounded",
          isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
        )}>
          {isUp ? "+" : ""}{changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-2 truncate">{index.name}</div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xl font-semibold">
          {currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className={cn("flex items-center gap-1 text-sm", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}{change.toFixed(2)}
        </span>
      </div>
    </Link>
  );
}

function StockRow({ stock, showRank, rank }: { stock: any; showRank?: boolean; rank?: number }) {
  const currentPrice = Number(stock.current_price) || 0;
  const previousClose = Number(stock.previous_close) || currentPrice;
  const change = Number(stock.price_change) || (currentPrice - previousClose);
  const changePercent = Number(stock.price_change_percent) || (previousClose ? ((change / previousClose) * 100) : 0);
  const isUp = change >= 0;

  return (
    <Link
      href={`/companies/${stock.symbol?.toLowerCase()}`}
      className="flex items-center gap-4 p-3 hover:bg-terminal-bg-elevated rounded-lg transition-colors"
    >
      {showRank && (
        <span className="w-6 text-sm text-muted-foreground font-medium">{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground">{stock.exchange?.code || stock.exchange}</span>
        </div>
        <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono">{currentPrice.toFixed(2)}</div>
        <div className={cn("text-sm", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="hidden md:block text-right w-20">
        <div className="text-sm">{Number(stock.volume || 0).toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Volume</div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data using SWR hooks
  const exchangeFilter = selectedExchange === "all" ? undefined : selectedExchange;
  const { data: indicesData, isLoading: indicesLoading, mutate: refreshIndices } = useIndices(exchangeFilter);
  const { data: gainersData, isLoading: gainersLoading } = useGainers(exchangeFilter, 5);
  const { data: losersData, isLoading: losersLoading } = useLosers(exchangeFilter, 5);
  const { data: mostActiveData, isLoading: activeLoading } = useMostActive(exchangeFilter, 5);
  const { data: exchangesData } = useExchanges();

  const indices = indicesData || [];
  const gainers = gainersData || [];
  const losers = losersData || [];
  const mostActive = mostActiveData || [];
  const exchanges = exchangesData || [];

  const handleRefresh = () => {
    refreshIndices();
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Markets</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString()}
              <button
                onClick={handleRefresh}
                className="text-brand-orange hover:text-brand-orange-light"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-elevated border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Exchange Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {exchangeTabs.map((exchange) => (
            <button
              key={exchange.id}
              onClick={() => setSelectedExchange(exchange.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedExchange === exchange.id
                  ? "bg-brand-orange text-white"
                  : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {exchange.label}
            </button>
          ))}
        </div>

        {/* Market Indices */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-orange" />
              Market Indices
            </h2>
            <Link
              href="/markets/indices"
              className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicesLoading ? (
              [...Array(6)].map((_, i) => <IndexCardSkeleton key={i} />)
            ) : indices.length > 0 ? (
              indices.slice(0, 6).map((index: any) => (
                <IndexCard key={index.code || index.id} index={index} />
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-muted-foreground bg-terminal-bg-secondary rounded-lg">
                No indices data available
              </div>
            )}
          </div>
        </section>

        {/* Top Movers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Gainers */}
          <section className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-market-up" />
                Top Gainers
              </h2>
              <Link
                href="/markets/gainers"
                className="text-xs text-brand-orange hover:text-brand-orange-light"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-terminal-border">
              {gainersLoading ? (
                [...Array(5)].map((_, i) => <StockRowSkeleton key={i} />)
              ) : gainers.length > 0 ? (
                gainers.map((stock: any, i: number) => (
                  <StockRow key={stock.symbol || stock.id} stock={stock} showRank rank={i + 1} />
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </section>

          {/* Top Losers */}
          <section className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-market-down" />
                Top Losers
              </h2>
              <Link
                href="/markets/losers"
                className="text-xs text-brand-orange hover:text-brand-orange-light"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-terminal-border">
              {losersLoading ? (
                [...Array(5)].map((_, i) => <StockRowSkeleton key={i} />)
              ) : losers.length > 0 ? (
                losers.map((stock: any, i: number) => (
                  <StockRow key={stock.symbol || stock.id} stock={stock} showRank rank={i + 1} />
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </section>

          {/* Most Active */}
          <section className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-terminal-border">
              <h2 className="font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-orange" />
                Most Active
              </h2>
              <Link
                href="/markets/active"
                className="text-xs text-brand-orange hover:text-brand-orange-light"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-terminal-border">
              {activeLoading ? (
                [...Array(5)].map((_, i) => <StockRowSkeleton key={i} />)
              ) : mostActive.length > 0 ? (
                mostActive.map((stock: any, i: number) => (
                  <StockRow key={stock.symbol || stock.id} stock={stock} showRank rank={i + 1} />
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/markets/forex"
            className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors text-center"
          >
            <span className="font-medium">Forex</span>
            <p className="text-xs text-muted-foreground mt-1">Currency Rates</p>
          </Link>
          <Link
            href="/markets/commodities"
            className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors text-center"
          >
            <span className="font-medium">Commodities</span>
            <p className="text-xs text-muted-foreground mt-1">Gold, Oil & More</p>
          </Link>
          <Link
            href="/markets/crypto"
            className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors text-center"
          >
            <span className="font-medium">Crypto</span>
            <p className="text-xs text-muted-foreground mt-1">Digital Assets</p>
          </Link>
          <Link
            href="/screener"
            className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors text-center"
          >
            <span className="font-medium">Screener</span>
            <p className="text-xs text-muted-foreground mt-1">Filter Stocks</p>
          </Link>
        </section>
      </div>
    </MainLayout>
  );
}
