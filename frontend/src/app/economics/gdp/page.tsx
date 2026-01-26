"use client";

import Link from "next/link";
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const gdpData = [
  { country: "South Africa", flag: "ZA", gdp: 405.87, growth: 0.9, quarter: "Q3 2024" },
  { country: "Nigeria", flag: "NG", gdp: 477.39, growth: 3.4, quarter: "Q3 2024" },
  { country: "Egypt", flag: "EG", gdp: 476.75, growth: 2.4, quarter: "Q3 2024" },
  { country: "Kenya", flag: "KE", gdp: 113.42, growth: 5.6, quarter: "Q3 2024" },
  { country: "Morocco", flag: "MA", gdp: 142.87, growth: 3.1, quarter: "Q3 2024" },
  { country: "Ethiopia", flag: "ET", gdp: 126.78, growth: 6.1, quarter: "Q3 2024" },
  { country: "Ghana", flag: "GH", gdp: 77.59, growth: 2.9, quarter: "Q3 2024" },
  { country: "Tanzania", flag: "TZ", gdp: 75.71, growth: 5.2, quarter: "Q3 2024" },
];

export default function GDPPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-brand-orange" />
              GDP Data
            </h1>
            <p className="text-muted-foreground">Gross Domestic Product by country</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">GDP (USD Bn)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">YoY Growth</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {gdpData.map((country) => {
                const isUp = country.growth >= 0;
                return (
                  <tr key={country.country} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{country.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">${country.gdp.toFixed(2)}B</td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                        isUp ? "bg-market-up/20 text-market-up" : "bg-market-down/20 text-market-down"
                      )}>
                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isUp ? "+" : ""}{country.growth.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">{country.quarter}</td>
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
