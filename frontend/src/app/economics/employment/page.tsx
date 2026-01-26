"use client";

import Link from "next/link";
import { Users, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const employmentData = [
  { country: "South Africa", unemployment: 32.1, previous: 32.9, laborForce: 23.5, date: "Q3 2024" },
  { country: "Nigeria", unemployment: 5.0, previous: 5.3, laborForce: 90.2, date: "Q3 2024" },
  { country: "Egypt", unemployment: 6.9, previous: 7.1, laborForce: 29.8, date: "Q3 2024" },
  { country: "Kenya", unemployment: 5.7, previous: 5.5, laborForce: 22.3, date: "Q3 2024" },
  { country: "Ghana", unemployment: 14.7, previous: 13.9, laborForce: 14.1, date: "Q3 2024" },
  { country: "Tanzania", unemployment: 2.6, previous: 2.7, laborForce: 28.4, date: "Q3 2024" },
  { country: "Morocco", unemployment: 11.8, previous: 12.3, laborForce: 12.1, date: "Q3 2024" },
  { country: "Ethiopia", unemployment: 3.5, previous: 3.4, laborForce: 54.2, date: "Q3 2024" },
];

export default function EmploymentPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-orange" />
              Employment Data
            </h1>
            <p className="text-muted-foreground">Unemployment rates and labor force statistics</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Unemployment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Previous</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Labor Force (M)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {employmentData.map((country) => {
                const isImproving = country.unemployment < country.previous;
                return (
                  <tr key={country.country} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-medium">{country.country}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-lg">{country.unemployment.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-sm font-mono",
                        isImproving ? "text-market-up" : "text-market-down"
                      )}>
                        {isImproving ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {country.previous.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{country.laborForce}M</td>
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
