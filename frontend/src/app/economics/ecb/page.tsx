"use client";

import Link from "next/link";
import { Landmark, ArrowLeft, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const ecbData = {
  currentRate: 4.50,
  previousRate: 4.50,
  lastChange: "Hold",
  lastMeeting: "Dec 12, 2024",
  nextMeeting: "Jan 25, 2025",
  inflationTarget: "2%",
  currentInflation: 2.4,
};

const rateHistory = [
  { date: "Dec 2024", rate: 4.50, change: "hold" },
  { date: "Oct 2024", rate: 4.50, change: "cut" },
  { date: "Sep 2024", rate: 4.25, change: "cut" },
  { date: "Jul 2024", rate: 4.50, change: "hold" },
  { date: "Jun 2024", rate: 4.50, change: "cut" },
  { date: "Apr 2024", rate: 4.75, change: "hold" },
  { date: "Mar 2024", rate: 4.75, change: "hold" },
  { date: "Jan 2024", rate: 4.75, change: "hold" },
];

const ecbRates = [
  { name: "Main Refinancing Rate", value: "4.50%", description: "Primary rate for bank lending" },
  { name: "Deposit Facility", value: "4.00%", description: "Rate on overnight deposits" },
  { name: "Marginal Lending", value: "4.75%", description: "Emergency overnight lending rate" },
];

export default function ECBPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6 text-brand-orange" />
              European Central Bank
            </h1>
            <p className="text-muted-foreground">ECB monetary policy and interest rates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Main Refinancing Rate</div>
            <div className="text-4xl font-mono font-bold text-brand-orange">{ecbData.currentRate.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground mt-2">Last action: {ecbData.lastChange}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">HICP Inflation</div>
            <div className="text-4xl font-mono font-bold">{ecbData.currentInflation}%</div>
            <div className="text-sm text-muted-foreground mt-2">Target: {ecbData.inflationTarget}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Next Meeting</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              {ecbData.nextMeeting}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Last: {ecbData.lastMeeting}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="p-4 border-b border-terminal-border">
              <h2 className="font-semibold">ECB Key Rates</h2>
            </div>
            <div className="divide-y divide-terminal-border">
              {ecbRates.map((rate, idx) => (
                <div key={idx} className="p-4 hover:bg-terminal-bg-elevated">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{rate.name}</span>
                    <span className="font-mono text-brand-orange">{rate.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rate.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="p-4 border-b border-terminal-border">
              <h2 className="font-semibold">Rate History</h2>
            </div>
            <table className="w-full">
              <thead className="bg-terminal-bg border-b border-terminal-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Rate</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {rateHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-4 font-medium">{item.date}</td>
                    <td className="px-4 py-4 text-right font-mono">{item.rate.toFixed(2)}%</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize",
                          item.change === "hike" ? "bg-market-down/20 text-market-down" :
                          item.change === "cut" ? "bg-market-up/20 text-market-up" :
                          "bg-terminal-bg-elevated text-muted-foreground"
                        )}>
                          {item.change === "hike" && <TrendingUp className="h-3 w-3" />}
                          {item.change === "cut" && <TrendingDown className="h-3 w-3" />}
                          {item.change}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
