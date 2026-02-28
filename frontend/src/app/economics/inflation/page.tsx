"use client";

import Link from "next/link";
import { TrendingUp, ArrowLeft, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const inflationData = [
  { country: "South Africa", rate: 5.3, previous: 5.6, target: "3-6%", date: "Dec 2024" },
  { country: "Nigeria", rate: 28.9, previous: 27.3, target: "6-9%", date: "Dec 2024" },
  { country: "Egypt", rate: 25.5, previous: 26.5, target: "7%", date: "Dec 2024" },
  { country: "Kenya", rate: 4.5, previous: 4.8, target: "5%", date: "Dec 2024" },
  { country: "Ghana", rate: 23.2, previous: 22.7, target: "8%", date: "Dec 2024" },
  { country: "Tanzania", rate: 3.1, previous: 3.0, target: "3-5%", date: "Dec 2024" },
  { country: "Morocco", rate: 0.9, previous: 1.2, target: "2%", date: "Dec 2024" },
  { country: "Ethiopia", rate: 15.7, previous: 16.3, target: "8%", date: "Dec 2024" },
];

export default function InflationPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-brand-orange" />
              Inflation Rates
            </h1>
            <p className="text-muted-foreground">Consumer Price Index by country</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Current Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Previous</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Target</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {inflationData.map((country) => {
                const isDecreasing = country.rate < country.previous;
                return (
                  <tr key={country.country} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-medium">{country.country}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-lg">{country.rate.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-sm font-mono",
                        isDecreasing ? "text-market-up" : "text-market-down"
                      )}>
                        {isDecreasing ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {country.previous.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">{country.target}</td>
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
