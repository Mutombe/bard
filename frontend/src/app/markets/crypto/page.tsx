"use client";

import Link from "next/link";
import { Bitcoin, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const cryptoData = [
  { symbol: "BTC", name: "Bitcoin", price: 42850.45, change: 2.35, marketCap: "$840B", volume: "$28.5B" },
  { symbol: "ETH", name: "Ethereum", price: 2285.60, change: 3.12, marketCap: "$275B", volume: "$12.8B" },
  { symbol: "BNB", name: "BNB", price: 312.45, change: 1.45, marketCap: "$48B", volume: "$1.2B" },
  { symbol: "SOL", name: "Solana", price: 98.75, change: 5.67, marketCap: "$42B", volume: "$2.8B" },
  { symbol: "XRP", name: "XRP", price: 0.5245, change: -1.23, marketCap: "$28B", volume: "$1.5B" },
  { symbol: "ADA", name: "Cardano", price: 0.5180, change: 0.85, marketCap: "$18B", volume: "$450M" },
  { symbol: "AVAX", name: "Avalanche", price: 35.45, change: 4.25, marketCap: "$13B", volume: "$580M" },
  { symbol: "DOT", name: "Polkadot", price: 7.85, change: 2.15, marketCap: "$10B", volume: "$320M" },
  { symbol: "MATIC", name: "Polygon", price: 0.8245, change: -0.78, marketCap: "$8B", volume: "$285M" },
  { symbol: "LINK", name: "Chainlink", price: 14.85, change: 1.92, marketCap: "$8.5B", volume: "$420M" },
  { symbol: "NEAR", name: "NEAR Protocol", price: 3.45, change: 3.45, marketCap: "$3.8B", volume: "$185M" },
  { symbol: "UNI", name: "Uniswap", price: 6.25, change: -0.45, marketCap: "$4.7B", volume: "$125M" },
];

export default function CryptoPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bitcoin className="h-6 w-6 text-brand-orange" />
              Cryptocurrency
            </h1>
            <p className="text-muted-foreground">Digital asset prices and market data</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cryptoData.slice(0, 4).map((crypto) => {
            const isUp = crypto.change >= 0;
            return (
              <div key={crypto.symbol} className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold text-brand-orange">{crypto.symbol}</span>
                  {isUp ? (
                    <TrendingUp className="h-4 w-4 text-market-up" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-market-down" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{crypto.name}</div>
                <div className="text-xl font-mono">${crypto.price.toLocaleString()}</div>
                <div className={cn(
                  "text-sm font-mono",
                  isUp ? "text-market-up" : "text-market-down"
                )}>
                  {isUp ? "+" : ""}{crypto.change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="font-semibold">All Cryptocurrencies</h2>
          </div>
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Market Cap</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Volume (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {cryptoData.map((crypto) => {
                const isUp = crypto.change >= 0;
                return (
                  <tr key={crypto.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{crypto.symbol}</td>
                    <td className="px-4 py-4">{crypto.name}</td>
                    <td className="px-4 py-4 text-right font-mono">${crypto.price.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{crypto.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground">{crypto.marketCap}</td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground">{crypto.volume}</td>
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
