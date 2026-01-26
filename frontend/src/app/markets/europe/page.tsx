"use client";

import Link from "next/link";
import { Flag, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const europeIndices = [
  { symbol: "UKX", name: "FTSE 100", country: "UK", price: 7685.50, change: 0.35, currency: "GBP" },
  { symbol: "DAX", name: "DAX 40", country: "Germany", price: 16845.25, change: 0.72, currency: "EUR" },
  { symbol: "CAC", name: "CAC 40", country: "France", price: 7520.80, change: -0.28, currency: "EUR" },
  { symbol: "SMI", name: "Swiss Market Index", country: "Switzerland", price: 11250.45, change: 0.15, currency: "CHF" },
  { symbol: "IBEX", name: "IBEX 35", country: "Spain", price: 10125.60, change: 0.45, currency: "EUR" },
  { symbol: "AEX", name: "AEX Index", country: "Netherlands", price: 785.30, change: 0.58, currency: "EUR" },
  { symbol: "STOXX50", name: "Euro Stoxx 50", country: "Eurozone", price: 4580.90, change: 0.42, currency: "EUR" },
  { symbol: "OMXS30", name: "OMX Stockholm 30", country: "Sweden", price: 2345.20, change: -0.18, currency: "SEK" },
];

const europeStocks = [
  { symbol: "ASML", name: "ASML Holding", country: "NL", price: 685.40, change: 1.45, currency: "EUR" },
  { symbol: "LVMH", name: "LVMH", country: "FR", price: 725.80, change: 0.85, currency: "EUR" },
  { symbol: "SAP", name: "SAP SE", country: "DE", price: 158.25, change: 1.12, currency: "EUR" },
  { symbol: "NESN", name: "Nestle", country: "CH", price: 98.45, change: -0.32, currency: "CHF" },
  { symbol: "SHEL", name: "Shell", country: "UK", price: 2685.50, change: 0.78, currency: "GBP" },
  { symbol: "NOVO", name: "Novo Nordisk", country: "DK", price: 785.60, change: 2.35, currency: "DKK" },
  { symbol: "TTE", name: "TotalEnergies", country: "FR", price: 62.45, change: 0.45, currency: "EUR" },
  { symbol: "SIE", name: "Siemens", country: "DE", price: 172.30, change: 0.92, currency: "EUR" },
];

export default function EuropeMarketsPage() {
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
              European Markets
            </h1>
            <p className="text-muted-foreground">European equity markets</p>
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
              {europeIndices.map((index) => {
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
            <h2 className="font-semibold">Top European Stocks</h2>
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
              {europeStocks.map((stock) => {
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
