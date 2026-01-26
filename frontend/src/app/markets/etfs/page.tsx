"use client";

import Link from "next/link";
import { Layers, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const etfData = [
  { symbol: "STXNDQ", name: "Satrix Nasdaq 100", exchange: "JSE", price: 185.45, change: 1.23, aum: "R8.5B", expense: "0.25%" },
  { symbol: "STX40", name: "Satrix 40", exchange: "JSE", price: 72.30, change: 0.85, aum: "R12.2B", expense: "0.10%" },
  { symbol: "STXWDM", name: "Satrix World", exchange: "JSE", price: 145.60, change: -0.45, aum: "R5.8B", expense: "0.30%" },
  { symbol: "NFEMOM", name: "NewFunds Momentum", exchange: "JSE", price: 35.80, change: 2.15, aum: "R2.1B", expense: "0.45%" },
  { symbol: "CSEW40", name: "CoreShares Equal Weight", exchange: "JSE", price: 58.90, change: 0.67, aum: "R1.8B", expense: "0.25%" },
  { symbol: "1NVEST", name: "1nvest SA Bond", exchange: "JSE", price: 42.15, change: -0.12, aum: "R3.2B", expense: "0.15%" },
  { symbol: "NGXBNK", name: "NGX Banking ETF", exchange: "NGX", price: 28.50, change: 3.45, aum: "₦45B", expense: "0.50%" },
  { symbol: "NGXIND", name: "NGX Industrial ETF", exchange: "NGX", price: 15.75, change: 1.89, aum: "₦28B", expense: "0.55%" },
  { symbol: "ABSA", name: "Absa NewGold", exchange: "JSE", price: 385.20, change: 0.52, aum: "R25.6B", expense: "0.30%" },
  { symbol: "PTXTEN", name: "Platinium Top 10", exchange: "JSE", price: 92.40, change: -0.78, aum: "R4.5B", expense: "0.35%" },
];

export default function ETFsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6 text-brand-orange" />
              ETFs
            </h1>
            <p className="text-muted-foreground">Exchange-traded funds on African exchanges</p>
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">AUM</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Expense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {etfData.map((etf) => {
                const isUp = etf.change >= 0;
                return (
                  <tr key={etf.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{etf.symbol}</td>
                    <td className="px-4 py-4">{etf.name}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-terminal-bg-elevated">
                        {etf.exchange}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{etf.price.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{etf.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-muted-foreground">{etf.aum}</td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">{etf.expense}</td>
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
