"use client";

import Link from "next/link";
import { Flag, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const asiaIndices = [
  { symbol: "NKY", name: "Nikkei 225", country: "Japan", price: 36250.45, change: 0.85, currency: "JPY" },
  { symbol: "HSI", name: "Hang Seng", country: "Hong Kong", price: 16485.20, change: -1.25, currency: "HKD" },
  { symbol: "SHCOMP", name: "Shanghai Composite", country: "China", price: 2885.60, change: -0.45, currency: "CNY" },
  { symbol: "KOSPI", name: "KOSPI", country: "South Korea", price: 2545.80, change: 0.32, currency: "KRW" },
  { symbol: "STI", name: "Straits Times", country: "Singapore", price: 3245.15, change: 0.18, currency: "SGD" },
  { symbol: "SENSEX", name: "BSE Sensex", country: "India", price: 72450.30, change: 0.65, currency: "INR" },
  { symbol: "TWSE", name: "Taiwan Weighted", country: "Taiwan", price: 18250.75, change: 1.12, currency: "TWD" },
  { symbol: "ASX200", name: "S&P/ASX 200", country: "Australia", price: 7685.40, change: 0.42, currency: "AUD" },
];

const asiaStocks = [
  { symbol: "7203", name: "Toyota Motor", country: "JP", price: 2845.50, change: 0.85, currency: "JPY" },
  { symbol: "9988", name: "Alibaba Group", country: "HK", price: 78.45, change: -2.15, currency: "HKD" },
  { symbol: "005930", name: "Samsung Electronics", country: "KR", price: 71500, change: 1.23, currency: "KRW" },
  { symbol: "RELIANCE", name: "Reliance Industries", country: "IN", price: 2485.60, change: 0.78, currency: "INR" },
  { symbol: "2330", name: "TSMC", country: "TW", price: 585.50, change: 2.45, currency: "TWD" },
  { symbol: "0700", name: "Tencent Holdings", country: "HK", price: 325.80, change: -1.35, currency: "HKD" },
  { symbol: "BHP", name: "BHP Group", country: "AU", price: 45.85, change: 0.55, currency: "AUD" },
  { symbol: "6758", name: "Sony Group", country: "JP", price: 12450, change: 1.15, currency: "JPY" },
];

export default function AsiaMarketsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flag className="h-6 w-6 text-brand-orange" />
              Asian Markets
            </h1>
            <p className="text-muted-foreground">Asia-Pacific equity markets</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden mb-6">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Major Indices</h2>
          </div>
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Index</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {asiaIndices.map((index) => {
                const isUp = index.change >= 0;
                return (
                  <tr key={index.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{index.symbol}</td>
                    <td className="px-4 py-4">{index.name}</td>
                    <td className="px-4 py-4 text-center text-sm text-muted-foreground">{index.country}</td>
                    <td className="px-4 py-4 text-right font-mono">{index.price.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{index.change.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Top Asian Stocks</h2>
          </div>
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {asiaStocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{stock.symbol}</td>
                    <td className="px-4 py-4">{stock.name}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-terminal-bg-elevated">
                        {stock.country}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">
                      {stock.currency} {stock.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{stock.change.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
