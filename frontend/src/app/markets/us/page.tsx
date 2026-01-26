"use client";

import Link from "next/link";
import { Flag, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const usIndices = [
  { symbol: "SPX", name: "S&P 500", price: 4850.25, change: 0.45, ytd: 2.8 },
  { symbol: "DJI", name: "Dow Jones", price: 38245.50, change: 0.32, ytd: 1.9 },
  { symbol: "IXIC", name: "Nasdaq Composite", price: 15320.80, change: 0.78, ytd: 3.5 },
  { symbol: "RUT", name: "Russell 2000", price: 1985.45, change: -0.25, ytd: -1.2 },
];

const usStocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 185.92, change: 1.23, marketCap: "$2.89T" },
  { symbol: "MSFT", name: "Microsoft", price: 405.45, change: 0.85, marketCap: "$3.01T" },
  { symbol: "GOOGL", name: "Alphabet", price: 142.80, change: -0.45, marketCap: "$1.78T" },
  { symbol: "AMZN", name: "Amazon", price: 178.25, change: 2.15, marketCap: "$1.85T" },
  { symbol: "NVDA", name: "NVIDIA", price: 585.60, change: 3.45, marketCap: "$1.45T" },
  { symbol: "META", name: "Meta Platforms", price: 385.90, change: 1.67, marketCap: "$985B" },
  { symbol: "TSLA", name: "Tesla", price: 245.80, change: -1.89, marketCap: "$780B" },
  { symbol: "BRK.B", name: "Berkshire Hathaway", price: 365.20, change: 0.42, marketCap: "$785B" },
];

export default function USMarketsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Flag className="h-6 w-6 text-brand-orange" />
              US Markets
            </h1>
            <p className="text-muted-foreground">United States equity markets</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {usIndices.map((index) => {
            const isUp = index.change >= 0;
            return (
              <div key={index.symbol} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-brand-orange">{index.symbol}</span>
                  {isUp ? (
                    <TrendingUp className="h-4 w-4 text-market-up" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-market-down" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{index.name}</div>
                <div className="text-xl font-mono">{index.price.toLocaleString()}</div>
                <div className={cn(
                  "text-sm font-mono",
                  isUp ? "text-market-up" : "text-market-down"
                )}>
                  {isUp ? "+" : ""}{index.change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">Top US Stocks</h2>
          </div>
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {usStocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{stock.symbol}</td>
                    <td className="px-4 py-4">{stock.name}</td>
                    <td className="px-4 py-4 text-right font-mono">${stock.price.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{stock.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground">{stock.marketCap}</td>
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
