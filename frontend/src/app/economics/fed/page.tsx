"use client";

import Link from "next/link";
import { Landmark, ArrowLeft, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const fedData = {
  currentRate: 5.50,
  previousRate: 5.50,
  lastChange: "Hold",
  lastMeeting: "Dec 18, 2024",
  nextMeeting: "Jan 29, 2025",
  inflationTarget: "2%",
  currentInflation: 2.9,
};

const rateHistory = [
  { date: "Dec 2024", rate: 5.50, change: "hold" },
  { date: "Nov 2024", rate: 5.50, change: "cut" },
  { date: "Sep 2024", rate: 5.00, change: "cut" },
  { date: "Jul 2024", rate: 5.50, change: "hold" },
  { date: "Jun 2024", rate: 5.50, change: "hold" },
  { date: "May 2024", rate: 5.50, change: "hold" },
  { date: "Mar 2024", rate: 5.50, change: "hold" },
  { date: "Jan 2024", rate: 5.50, change: "hold" },
];

const fedTools = [
  { name: "Fed Funds Rate", value: "5.25-5.50%", description: "Target range for overnight lending" },
  { name: "Discount Rate", value: "5.50%", description: "Rate for direct lending to banks" },
  { name: "IOER", value: "5.40%", description: "Interest on excess reserves" },
  { name: "RRP Rate", value: "5.30%", description: "Reverse repo rate" },
];

export default function FedPage() {
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
              Federal Reserve
            </h1>
            <p className="text-muted-foreground">US Fed monetary policy and interest rates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Fed Funds Rate</div>
            <div className="text-4xl font-mono font-bold text-brand-orange">{fedData.currentRate.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground mt-2">Last action: {fedData.lastChange}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">PCE Inflation</div>
            <div className="text-4xl font-mono font-bold">{fedData.currentInflation}%</div>
            <div className="text-sm text-muted-foreground mt-2">Target: {fedData.inflationTarget}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Next FOMC Meeting</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              {fedData.nextMeeting}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Last: {fedData.lastMeeting}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <div className="p-4 border-b border-terminal-border">
              <h2 className="font-semibold">Fed Policy Tools</h2>
            </div>
            <div className="divide-y divide-terminal-border">
              {fedTools.map((tool, idx) => (
                <div key={idx} className="p-4 hover:bg-terminal-bg-elevated">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{tool.name}</span>
                    <span className="font-mono text-brand-orange">{tool.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
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
