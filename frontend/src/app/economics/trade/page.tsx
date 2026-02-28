"use client";

import Link from "next/link";
import { Globe, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const tradeData = [
  { country: "South Africa", exports: 108.5, imports: 102.3, balance: 6.2, currency: "USD Bn", date: "Nov 2024" },
  { country: "Nigeria", exports: 52.3, imports: 45.8, balance: 6.5, currency: "USD Bn", date: "Nov 2024" },
  { country: "Egypt", exports: 38.7, imports: 78.4, balance: -39.7, currency: "USD Bn", date: "Nov 2024" },
  { country: "Kenya", exports: 7.2, imports: 18.9, balance: -11.7, currency: "USD Bn", date: "Nov 2024" },
  { country: "Ghana", exports: 17.8, imports: 14.2, balance: 3.6, currency: "USD Bn", date: "Nov 2024" },
  { country: "Tanzania", exports: 6.4, imports: 11.8, balance: -5.4, currency: "USD Bn", date: "Nov 2024" },
  { country: "Morocco", exports: 36.5, imports: 58.9, balance: -22.4, currency: "USD Bn", date: "Nov 2024" },
  { country: "Ethiopia", exports: 3.8, imports: 15.2, balance: -11.4, currency: "USD Bn", date: "Nov 2024" },
];

export default function TradePage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-brand-orange" />
              Trade Balance
            </h1>
            <p className="text-muted-foreground">Import and export data by country</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Exports</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Imports</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {tradeData.map((country) => {
                const isSurplus = country.balance >= 0;
                return (
                  <tr key={country.country} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-medium">{country.country}</td>
                    <td className="px-4 py-4 text-right font-mono">${country.exports.toFixed(1)}B</td>
                    <td className="px-4 py-4 text-right font-mono">${country.imports.toFixed(1)}B</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isSurplus ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isSurplus ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isSurplus ? "+" : ""}{country.balance.toFixed(1)}B
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">{country.date}</td>
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
