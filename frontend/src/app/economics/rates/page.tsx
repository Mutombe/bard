"use client";

import Link from "next/link";
import { Calculator, ArrowLeft, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const ratesData = [
  { bank: "SARB", country: "South Africa", rate: 8.25, previous: 8.25, change: "hold", nextMeeting: "Jan 30, 2025" },
  { bank: "CBN", country: "Nigeria", rate: 27.25, previous: 26.75, change: "hike", nextMeeting: "Feb 26, 2025" },
  { bank: "CBE", country: "Egypt", rate: 27.75, previous: 27.75, change: "hold", nextMeeting: "Feb 6, 2025" },
  { bank: "CBK", country: "Kenya", rate: 11.25, previous: 12.00, change: "cut", nextMeeting: "Feb 5, 2025" },
  { bank: "BOG", country: "Ghana", rate: 27.00, previous: 29.00, change: "cut", nextMeeting: "Jan 27, 2025" },
  { bank: "BOT", country: "Tanzania", rate: 6.00, previous: 6.00, change: "hold", nextMeeting: "Q1 2025" },
  { bank: "Fed", country: "United States", rate: 5.50, previous: 5.50, change: "hold", nextMeeting: "Jan 29, 2025" },
  { bank: "ECB", country: "Eurozone", rate: 4.50, previous: 4.50, change: "hold", nextMeeting: "Jan 25, 2025" },
];

function getChangeIcon(change: string) {
  switch (change) {
    case "hike":
      return <TrendingUp className="h-4 w-4 text-market-down" />;
    case "cut":
      return <TrendingDown className="h-4 w-4 text-market-up" />;
    default:
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function getChangeColor(change: string) {
  switch (change) {
    case "hike":
      return "bg-market-down/20 text-market-down";
    case "cut":
      return "bg-market-up/20 text-market-up";
    default:
      return "bg-terminal-bg-elevated text-muted-foreground";
  }
}

export default function RatesPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-brand-orange" />
              Interest Rates
            </h1>
            <p className="text-muted-foreground">Central bank policy rates</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Central Bank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Country</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Previous</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Last Action</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Next Meeting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {ratesData.map((bank) => (
                <tr key={bank.bank} className="hover:bg-terminal-bg-elevated">
                  <td className="px-4 py-4 font-mono font-semibold text-brand-orange">{bank.bank}</td>
                  <td className="px-4 py-4">{bank.country}</td>
                  <td className="px-4 py-4 text-right font-mono text-lg">{bank.rate.toFixed(2)}%</td>
                  <td className="px-4 py-4 text-right font-mono text-muted-foreground">{bank.previous.toFixed(2)}%</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize",
                        getChangeColor(bank.change)
                      )}>
                        {getChangeIcon(bank.change)}
                        {bank.change}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-muted-foreground">{bank.nextMeeting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
