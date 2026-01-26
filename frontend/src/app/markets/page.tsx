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

interface MarketIndex {
  symbol: string;
  name: string;
  exchange: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
}

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
}

const exchanges = [
  { id: "all", label: "All Markets" },
  { id: "jse", label: "JSE" },
  { id: "ngx", label: "NGX" },
  { id: "egx", label: "EGX" },
  { id: "nse", label: "NSE Kenya" },
  { id: "global", label: "Global" },
];

const africanIndices: MarketIndex[] = [
  { symbol: "J203", name: "JSE All Share Index", exchange: "JSE", value: 78456.23, change: 234.56, changePercent: 0.30, high: 78678.90, low: 78123.45, volume: "1.2B" },
  { symbol: "J200", name: "JSE Top 40", exchange: "JSE", value: 71234.56, change: -123.45, changePercent: -0.17, high: 71456.78, low: 71012.34, volume: "890M" },
  { symbol: "NGXASI", name: "NGX All Share", exchange: "NGX", value: 98234.56, change: 456.78, changePercent: 0.47, high: 98567.89, low: 97890.12, volume: "2.3B" },
  { symbol: "EGX30", name: "EGX 30", exchange: "EGX", value: 28765.43, change: 189.23, changePercent: 0.66, high: 28890.12, low: 28567.34, volume: "1.1B" },
  { symbol: "NSE20", name: "NSE 20 Share", exchange: "NSE", value: 1456.78, change: -12.34, changePercent: -0.84, high: 1478.90, low: 1445.67, volume: "45M" },
  { symbol: "MASI", name: "MASI", exchange: "CSE", value: 12345.67, change: 67.89, changePercent: 0.55, high: 12378.90, low: 12234.56, volume: "320M" },
];

const globalIndices: MarketIndex[] = [
  { symbol: "SPX", name: "S&P 500", exchange: "NYSE", value: 5234.56, change: 23.45, changePercent: 0.45, high: 5245.67, low: 5212.34, volume: "4.5B" },
  { symbol: "DJI", name: "Dow Jones", exchange: "NYSE", value: 38456.78, change: 156.78, changePercent: 0.41, high: 38567.89, low: 38234.56, volume: "3.2B" },
  { symbol: "FTSE", name: "FTSE 100", exchange: "LSE", value: 7890.12, change: -34.56, changePercent: -0.44, high: 7923.45, low: 7856.78, volume: "2.1B" },
  { symbol: "DAX", name: "DAX", exchange: "XETRA", value: 18234.56, change: 89.23, changePercent: 0.49, high: 18345.67, low: 18156.78, volume: "1.8B" },
];

const topStocks: Stock[] = [
  { symbol: "NPN", name: "Naspers Ltd", exchange: "JSE", price: 3245.67, change: 89.34, changePercent: 2.83, volume: "1.2M", marketCap: "R1.2T" },
  { symbol: "AGL", name: "Anglo American", exchange: "JSE", price: 567.34, change: 45.67, changePercent: 8.75, volume: "890K", marketCap: "R756B" },
  { symbol: "MTN", name: "MTN Group", exchange: "JSE", price: 156.78, change: 9.45, changePercent: 6.41, volume: "2.3M", marketCap: "R285B" },
  { symbol: "SBK", name: "Standard Bank", exchange: "JSE", price: 189.45, change: 8.67, changePercent: 4.80, volume: "1.5M", marketCap: "R298B" },
  { symbol: "SOL", name: "Sasol Ltd", exchange: "JSE", price: 267.89, change: -5.67, changePercent: -2.07, volume: "780K", marketCap: "R168B" },
  { symbol: "DANGCEM", name: "Dangote Cement", exchange: "NGX", price: 289.50, change: 4.50, changePercent: 1.58, volume: "3.4M", marketCap: "₦4.9T" },
  { symbol: "MTNN", name: "MTN Nigeria", exchange: "NGX", price: 245.60, change: -3.40, changePercent: -1.37, volume: "5.6M", marketCap: "₦5.0T" },
  { symbol: "GTCO", name: "Guaranty Trust", exchange: "NGX", price: 45.80, change: 1.20, changePercent: 2.69, volume: "12.3M", marketCap: "₦1.3T" },
];

function IndexCard({ index }: { index: MarketIndex }) {
  const isUp = index.change >= 0;

  return (
    <Link
      href={`/markets/indices/${index.symbol.toLowerCase()}`}
      className="block p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-mono font-semibold">{index.symbol}</span>
          <span className="text-xs text-muted-foreground ml-2">{index.exchange}</span>
        </div>
        <span className={cn(
          "px-2 py-0.5 text-xs font-semibold rounded",
          isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
        )}>
          {isUp ? "+" : ""}{index.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="text-xs text-muted-foreground mb-2 truncate">{index.name}</div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xl font-semibold">
          {index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className={cn("flex items-center gap-1 text-sm", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}{index.change.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 pt-2 border-t border-terminal-border grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="block text-foreground">{index.high.toLocaleString()}</span>
          <span>High</span>
        </div>
        <div>
          <span className="block text-foreground">{index.low.toLocaleString()}</span>
          <span>Low</span>
        </div>
        <div>
          <span className="block text-foreground">{index.volume}</span>
          <span>Volume</span>
        </div>
      </div>
    </Link>
  );
}

function StockRow({ stock }: { stock: Stock }) {
  const isUp = stock.change >= 0;

  return (
    <Link
      href={`/companies/${stock.symbol.toLowerCase()}`}
      className="flex items-center gap-4 p-3 hover:bg-terminal-bg-elevated rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground">{stock.exchange}</span>
        </div>
        <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono">{stock.price.toFixed(2)}</div>
        <div className={cn("text-sm", isUp ? "text-market-up" : "text-market-down")}>
          {isUp ? "+" : ""}{stock.change.toFixed(2)} ({isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="hidden md:block text-right w-20">
        <div className="text-sm">{stock.volume}</div>
        <div className="text-xs text-muted-foreground">Volume</div>
      </div>
      <div className="hidden lg:block text-right w-24">
        <div className="text-sm">{stock.marketCap}</div>
        <div className="text-xs text-muted-foreground">Mkt Cap</div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
              <button className="text-brand-orange hover:text-brand-orange-light">
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
          {exchanges.map((exchange) => (
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

        {/* African Indices */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-orange" />
              African Markets
            </h2>
            <Link
              href="/markets/indices"
              className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {africanIndices.map((index) => (
              <IndexCard key={index.symbol} index={index} />
            ))}
          </div>
        </section>

        {/* Global Indices */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-orange" />
              Global Markets
            </h2>
            <Link
              href="/markets/global"
              className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {globalIndices.map((index) => (
              <IndexCard key={index.symbol} index={index} />
            ))}
          </div>
        </section>

        {/* Stocks Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Top Stocks</h2>
            <Link
              href="/companies"
              className="text-sm text-brand-orange hover:text-brand-orange-light flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center gap-4 p-3 border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
              <div className="flex-1">Stock</div>
              <div className="text-right w-28">Price / Change</div>
              <div className="hidden md:block text-right w-20">Volume</div>
              <div className="hidden lg:block text-right w-24">Mkt Cap</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-terminal-border">
              {topStocks.map((stock) => (
                <StockRow key={stock.symbol} stock={stock} />
              ))}
            </div>
          </div>

          {/* Load More */}
          <div className="text-center pt-4">
            <button className="px-6 py-2 border border-terminal-border rounded-md text-sm font-medium hover:bg-terminal-bg-elevated transition-colors">
              Load More Stocks
            </button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
