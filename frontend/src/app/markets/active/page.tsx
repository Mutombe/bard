"use client";

import Link from "next/link";
import { Activity, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const activeStocks = [
  { symbol: "NPN", name: "Naspers", exchange: "JSE", price: 3245.50, change: 2.45, volume: "12.5M" },
  { symbol: "MTN", name: "MTN Group", exchange: "JSE", price: 98.75, change: -1.23, volume: "8.9M" },
  { symbol: "DANGCEM", name: "Dangote Cement", exchange: "NGX", price: 298.50, change: 3.12, volume: "15.2M" },
  { symbol: "GTCO", name: "Guaranty Trust", exchange: "NGX", price: 45.80, change: 5.67, volume: "22.1M" },
  { symbol: "SBK", name: "Standard Bank", exchange: "JSE", price: 185.30, change: 0.85, volume: "6.8M" },
  { symbol: "ABG", name: "Absa Group", exchange: "JSE", price: 142.60, change: -0.45, volume: "5.4M" },
  { symbol: "SCOM", name: "Safaricom", exchange: "NSE", price: 28.45, change: 1.89, volume: "18.7M" },
  { symbol: "ZENITH", name: "Zenith Bank", exchange: "NGX", price: 38.90, change: 4.23, volume: "28.5M" },
  { symbol: "SOL", name: "Sasol", exchange: "JSE", price: 145.80, change: -2.15, volume: "4.2M" },
  { symbol: "FSR", name: "FirstRand", exchange: "JSE", price: 68.45, change: 1.12, volume: "7.1M" },
  { symbol: "ANG", name: "AngloGold Ashanti", exchange: "JSE", price: 485.20, change: 3.45, volume: "3.8M" },
  { symbol: "EQTY", name: "Equity Group", exchange: "NSE", price: 42.15, change: 2.78, volume: "9.4M" },
];

export default function MostActivePage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-brand-orange" />
              Most Active
            </h1>
            <p className="text-muted-foreground">Highest volume stocks across African exchanges</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Exchange</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {activeStocks.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4">
                      <Link href={`/company/${stock.symbol}`} className="font-mono font-semibold text-brand-orange hover:underline">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{stock.name}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-terminal-bg-elevated">
                        {stock.exchange}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{stock.price.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{stock.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground">{stock.volume}</td>
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
