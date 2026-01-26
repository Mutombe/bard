"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Star,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

interface ExchangeData {
  name: string;
  fullName: string;
  country: string;
  currency: string;
  timezone: string;
  indexName: string;
  indexValue: number;
  indexChange: number;
  indexChangePercent: number;
  stocks: Stock[];
}

const exchangeData: Record<string, ExchangeData> = {
  jse: {
    name: "JSE",
    fullName: "Johannesburg Stock Exchange",
    country: "South Africa",
    currency: "ZAR",
    timezone: "SAST",
    indexName: "JSE All Share",
    indexValue: 78456.32,
    indexChange: 456.78,
    indexChangePercent: 0.59,
    stocks: [
      { symbol: "NPN", name: "Naspers Ltd", price: 3245.67, change: 45.23, changePercent: 1.41, volume: 2450000, marketCap: 1250000, sector: "Technology" },
      { symbol: "MTN", name: "MTN Group Ltd", price: 156.78, change: -2.34, changePercent: -1.47, volume: 8900000, marketCap: 285000, sector: "Telecom" },
      { symbol: "SBK", name: "Standard Bank", price: 189.45, change: 3.12, changePercent: 1.68, volume: 5600000, marketCap: 298000, sector: "Financials" },
      { symbol: "FSR", name: "FirstRand Ltd", price: 72.34, change: 1.23, changePercent: 1.73, volume: 7800000, marketCap: 405000, sector: "Financials" },
      { symbol: "AGL", name: "Anglo American", price: 567.34, change: -12.45, changePercent: -2.15, volume: 3200000, marketCap: 756000, sector: "Mining" },
      { symbol: "SOL", name: "Sasol Ltd", price: 234.56, change: 5.67, changePercent: 2.48, volume: 4100000, marketCap: 147000, sector: "Energy" },
      { symbol: "BHP", name: "BHP Group", price: 456.78, change: 8.90, changePercent: 1.99, volume: 2100000, marketCap: 890000, sector: "Mining" },
      { symbol: "VOD", name: "Vodacom Group", price: 112.34, change: -1.56, changePercent: -1.37, volume: 3400000, marketCap: 205000, sector: "Telecom" },
    ],
  },
  ngx: {
    name: "NGX",
    fullName: "Nigerian Exchange Group",
    country: "Nigeria",
    currency: "NGN",
    timezone: "WAT",
    indexName: "NGX All Share",
    indexValue: 98234.56,
    indexChange: 1234.56,
    indexChangePercent: 1.27,
    stocks: [
      { symbol: "DANGCEM", name: "Dangote Cement", price: 275.50, change: 8.75, changePercent: 3.28, volume: 1250000, marketCap: 4690000, sector: "Materials" },
      { symbol: "GTCO", name: "Guaranty Trust", price: 42.30, change: 1.25, changePercent: 3.05, volume: 15600000, marketCap: 1240000, sector: "Financials" },
      { symbol: "ZENITH", name: "Zenith Bank", price: 35.80, change: 0.95, changePercent: 2.72, volume: 12400000, marketCap: 1125000, sector: "Financials" },
      { symbol: "MTNN", name: "MTN Nigeria", price: 195.00, change: -3.50, changePercent: -1.76, volume: 890000, marketCap: 3970000, sector: "Telecom" },
      { symbol: "AIRTEL", name: "Airtel Africa", price: 1850.00, change: 25.00, changePercent: 1.37, volume: 450000, marketCap: 6950000, sector: "Telecom" },
      { symbol: "BUA", name: "BUA Cement", price: 72.50, change: 2.15, changePercent: 3.06, volume: 980000, marketCap: 2460000, sector: "Materials" },
    ],
  },
  egx: {
    name: "EGX",
    fullName: "Egyptian Exchange",
    country: "Egypt",
    currency: "EGP",
    timezone: "EET",
    indexName: "EGX 30",
    indexValue: 28456.78,
    indexChange: -123.45,
    indexChangePercent: -0.43,
    stocks: [
      { symbol: "COMI", name: "Commercial Intl Bank", price: 75.40, change: -0.85, changePercent: -1.11, volume: 2800000, marketCap: 89000, sector: "Financials" },
      { symbol: "HRHO", name: "Hermes Holding", price: 12.50, change: 0.35, changePercent: 2.88, volume: 5400000, marketCap: 45000, sector: "Financials" },
      { symbol: "EAST", name: "Eastern Company", price: 18.20, change: -0.25, changePercent: -1.35, volume: 1200000, marketCap: 32000, sector: "Consumer" },
      { symbol: "TMGH", name: "Talaat Moustafa", price: 45.60, change: 1.20, changePercent: 2.70, volume: 3600000, marketCap: 92000, sector: "Real Estate" },
    ],
  },
  nse: {
    name: "NSE",
    fullName: "Nairobi Securities Exchange",
    country: "Kenya",
    currency: "KES",
    timezone: "EAT",
    indexName: "NSE 20",
    indexValue: 1856.45,
    indexChange: 23.67,
    indexChangePercent: 1.29,
    stocks: [
      { symbol: "SCOM", name: "Safaricom", price: 28.50, change: 0.75, changePercent: 2.70, volume: 18500000, marketCap: 1140000, sector: "Telecom" },
      { symbol: "EQTY", name: "Equity Bank", price: 42.80, change: 1.05, changePercent: 2.51, volume: 4200000, marketCap: 161000, sector: "Financials" },
      { symbol: "KCB", name: "KCB Group", price: 38.50, change: -0.45, changePercent: -1.16, volume: 3800000, marketCap: 123000, sector: "Financials" },
      { symbol: "EABL", name: "East African Breweries", price: 165.00, change: 3.50, changePercent: 2.17, volume: 890000, marketCap: 130000, sector: "Consumer" },
    ],
  },
  zse: {
    name: "ZSE",
    fullName: "Zimbabwe Stock Exchange",
    country: "Zimbabwe",
    currency: "ZWL",
    timezone: "CAT",
    indexName: "ZSE All Share",
    indexValue: 12456.78,
    indexChange: 345.67,
    indexChangePercent: 2.85,
    stocks: [
      { symbol: "ECOC", name: "Econet Wireless", price: 850.00, change: 25.00, changePercent: 3.03, volume: 450000, marketCap: 2200000, sector: "Telecom" },
      { symbol: "DLTA", name: "Delta Corporation", price: 320.00, change: 8.50, changePercent: 2.73, volume: 380000, marketCap: 410000, sector: "Consumer" },
      { symbol: "SEED", name: "Seed Co", price: 125.00, change: -2.50, changePercent: -1.96, volume: 120000, marketCap: 78000, sector: "Agriculture" },
    ],
  },
  bse: {
    name: "BSE",
    fullName: "Botswana Stock Exchange",
    country: "Botswana",
    currency: "BWP",
    timezone: "CAT",
    indexName: "BSE DCI",
    indexValue: 8234.56,
    indexChange: 45.23,
    indexChangePercent: 0.55,
    stocks: [
      { symbol: "FNBB", name: "First National Bank Botswana", price: 2.85, change: 0.05, changePercent: 1.79, volume: 850000, marketCap: 7200, sector: "Financials" },
      { symbol: "SECH", name: "Sefalana Holdings", price: 12.50, change: 0.25, changePercent: 2.04, volume: 320000, marketCap: 3100, sector: "Consumer" },
      { symbol: "LETSH", name: "Letshego Holdings", price: 1.45, change: -0.02, changePercent: -1.36, volume: 1200000, marketCap: 3100, sector: "Financials" },
    ],
  },
};

export default function ExchangePage() {
  const params = useParams();
  const exchangeSlug = (params.exchange as string)?.toLowerCase();
  const exchange = exchangeData[exchangeSlug];

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Stock>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  if (!exchange) {
    return (
      <MainLayout>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Exchange Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The exchange you're looking for doesn't exist or is not available.
          </p>
          <Link
            href="/markets"
            className="px-6 py-3 bg-brand-orange text-white rounded-md hover:bg-brand-orange-dark transition-colors inline-block"
          >
            View All Markets
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleSort = (field: keyof Stock) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredStocks = exchange.stocks
    .filter((stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}T`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}B`;
    return `${num}M`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/markets" className="hover:text-foreground">Markets</Link>
            <span>/</span>
            <span>{exchange.name}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{exchange.fullName}</h1>
          <p className="text-muted-foreground">
            {exchange.country} · {exchange.currency} · {exchange.timezone}
          </p>
        </div>

        {/* Index Overview */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-muted-foreground">{exchange.indexName}</h2>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="text-3xl font-bold font-mono">
                  {exchange.indexValue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </span>
                <span className={cn(
                  "flex items-center gap-1 text-lg font-mono",
                  exchange.indexChange >= 0 ? "text-market-up" : "text-market-down"
                )}>
                  {exchange.indexChange >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {exchange.indexChange >= 0 ? "+" : ""}{exchange.indexChange.toFixed(2)}
                  ({exchange.indexChangePercent >= 0 ? "+" : ""}{exchange.indexChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })} {exchange.timezone}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-bg-secondary border border-terminal-border rounded-md text-sm focus:outline-none focus:border-brand-orange"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredStocks.length} stocks
          </span>
        </div>

        {/* Stocks Table */}
        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-bg text-xs font-medium text-muted-foreground">
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4 hidden md:table-cell">Sector</th>
                <th className="text-right p-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("price")}>
                  <span className="flex items-center justify-end gap-1">
                    Price <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-right p-4 cursor-pointer hover:text-foreground" onClick={() => handleSort("changePercent")}>
                  <span className="flex items-center justify-end gap-1">
                    Change <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-right p-4 cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => handleSort("volume")}>
                  <span className="flex items-center justify-end gap-1">
                    Volume <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="text-right p-4 cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => handleSort("marketCap")}>
                  <span className="flex items-center justify-end gap-1">
                    Mkt Cap <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {filteredStocks.map((stock) => (
                <tr key={stock.symbol} className="hover:bg-terminal-bg-elevated transition-colors">
                  <td className="p-4">
                    <Link href={`/companies/${stock.symbol.toLowerCase()}`} className="hover:text-brand-orange">
                      <div className="font-mono font-semibold">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{stock.sector}</td>
                  <td className="p-4 text-right font-mono">
                    {exchange.currency === "ZAR" ? "R" : ""}{stock.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={cn(
                      "flex items-center justify-end gap-1 font-mono",
                      stock.change >= 0 ? "text-market-up" : "text-market-down"
                    )}>
                      {stock.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-muted-foreground hidden lg:table-cell">
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="p-4 text-right font-mono text-sm hidden md:table-cell">
                    {formatNumber(stock.marketCap)}
                  </td>
                  <td className="p-4">
                    <button className="p-2 text-muted-foreground hover:text-brand-orange transition-colors">
                      <Star className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStocks.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No stocks found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
