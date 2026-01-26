"use client";

import Link from "next/link";
import { LineChart, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const africanIndices = [
  { symbol: "J203", name: "JSE All Share", country: "South Africa", price: 80245.50, change: 1.25, ytd: 4.8 },
  { symbol: "J200", name: "JSE Top 40", country: "South Africa", price: 72580.30, change: 1.35, ytd: 5.2 },
  { symbol: "NGXASI", name: "NGX All-Share", country: "Nigeria", price: 98456.20, change: 0.85, ytd: 8.5 },
  { symbol: "EGX30", name: "EGX 30", country: "Egypt", price: 28945.80, change: -0.45, ytd: 12.3 },
  { symbol: "NSE20", name: "NSE 20", country: "Kenya", price: 1845.60, change: 0.65, ytd: 2.1 },
  { symbol: "GSE", name: "GSE Composite", country: "Ghana", price: 3285.40, change: 1.12, ytd: 6.8 },
  { symbol: "DSI", name: "DSE All Share", country: "Tanzania", price: 2156.30, change: 0.28, ytd: 1.5 },
  { symbol: "MASI", name: "MASI", country: "Morocco", price: 13485.70, change: 0.42, ytd: 3.2 },
];

const globalIndices = [
  { symbol: "SPX", name: "S&P 500", country: "USA", price: 4850.25, change: 0.45, ytd: 2.8 },
  { symbol: "DJI", name: "Dow Jones", country: "USA", price: 38245.50, change: 0.32, ytd: 1.9 },
  { symbol: "UKX", name: "FTSE 100", country: "UK", price: 7685.50, change: 0.35, ytd: 1.2 },
  { symbol: "DAX", name: "DAX 40", country: "Germany", price: 16845.25, change: 0.72, ytd: 2.5 },
  { symbol: "NKY", name: "Nikkei 225", country: "Japan", price: 36250.45, change: 0.85, ytd: 5.8 },
  { symbol: "HSI", name: "Hang Seng", country: "Hong Kong", price: 16485.20, change: -1.25, ytd: -3.2 },
];

export default function IndicesPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LineChart className="h-6 w-6 text-brand-orange" />
              Market Indices
            </h1>
            <p className="text-muted-foreground">Track major African and global indices</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="p-4 border-b border-terminal-border">
              <h2 className="font-semibold">African Indices</h2>
            </div>
            <table className="w-full">
              <thead className="bg-terminal-bg border-b border-terminal-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Index</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Country</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">YTD %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {africanIndices.map((index) => {
                  const isUp = index.change >= 0;
                  const isYtdUp = index.ytd >= 0;
                  return (
                    <tr key={index.symbol} className="hover:bg-terminal-bg-elevated">
                      <td className="px-4 py-4">
                        <Link href={`/markets/indices/${index.symbol}`} className="font-mono font-semibold text-brand-orange hover:underline">
                          {index.symbol}
                        </Link>
                      </td>
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
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "font-mono text-sm",
                          isYtdUp ? "text-market-up" : "text-market-down"
                        )}>
                          {isYtdUp ? "+" : ""}{index.ytd.toFixed(1)}%
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
              <h2 className="font-semibold">Global Indices</h2>
            </div>
            <table className="w-full">
              <thead className="bg-terminal-bg border-b border-terminal-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Index</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Country</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">YTD %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {globalIndices.map((index) => {
                  const isUp = index.change >= 0;
                  const isYtdUp = index.ytd >= 0;
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
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "font-mono text-sm",
                          isYtdUp ? "text-market-up" : "text-market-down"
                        )}>
                          {isYtdUp ? "+" : ""}{index.ytd.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
