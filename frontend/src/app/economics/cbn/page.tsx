"use client";

import Link from "next/link";
import { Landmark, ArrowLeft, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const cbnData = {
  currentRate: 27.25,
  previousRate: 26.75,
  lastChange: "Hike (+50bps)",
  lastMeeting: "Nov 26, 2024",
  nextMeeting: "Feb 26, 2025",
  inflationTarget: "6-9%",
  currentInflation: 28.9,
};

const rateHistory = [
  { date: "Nov 2024", rate: 27.25, change: "hike" },
  { date: "Sep 2024", rate: 26.75, change: "hike" },
  { date: "Jul 2024", rate: 26.25, change: "hike" },
  { date: "May 2024", rate: 24.75, change: "hike" },
  { date: "Mar 2024", rate: 22.75, change: "hike" },
  { date: "Feb 2024", rate: 18.75, change: "hike" },
  { date: "Nov 2023", rate: 18.75, change: "hold" },
  { date: "Sep 2023", rate: 18.75, change: "hold" },
];

export default function CBNPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6 text-brand-orange" />
              Central Bank of Nigeria
            </h1>
            <p className="text-muted-foreground">CBN monetary policy and interest rates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">MPR (Monetary Policy Rate)</div>
            <div className="text-4xl font-mono font-bold text-brand-orange">{cbnData.currentRate.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground mt-2">Last action: {cbnData.lastChange}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Inflation</div>
            <div className="text-4xl font-mono font-bold text-market-down">{cbnData.currentInflation}%</div>
            <div className="text-sm text-muted-foreground mt-2">Target: {cbnData.inflationTarget}</div>
          </div>
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
            <div className="text-sm text-muted-foreground mb-2">Next Meeting</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              {cbnData.nextMeeting}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Last: {cbnData.lastMeeting}</div>
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
                  <td className="px-4 py-4 text-right font-mono text-lg">{item.rate.toFixed(2)}%</td>
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
    </MainLayout>
  );
}
