"use client";

import Link from "next/link";
import { Calculator, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const earningsData = [
  { date: "Jan 28, 2025", symbol: "NPN", company: "Naspers", exchange: "JSE", epsEstimate: "R45.20", epsPrevious: "R42.15", revenue: "R58.2B" },
  { date: "Jan 29, 2025", symbol: "SOL", company: "Sasol", exchange: "JSE", epsEstimate: "R12.80", epsPrevious: "R15.45", revenue: "R285.4B" },
  { date: "Jan 30, 2025", symbol: "MTN", company: "MTN Group", exchange: "JSE", epsEstimate: "R8.45", epsPrevious: "R7.92", revenue: "R205.8B" },
  { date: "Jan 31, 2025", symbol: "DANGCEM", company: "Dangote Cement", exchange: "NGX", epsEstimate: "₦42.50", epsPrevious: "₦38.75", revenue: "₦1.8T" },
  { date: "Feb 3, 2025", symbol: "GTCO", company: "Guaranty Trust", exchange: "NGX", epsEstimate: "₦12.30", epsPrevious: "₦10.85", revenue: "₦890B" },
  { date: "Feb 5, 2025", symbol: "SBK", company: "Standard Bank", exchange: "JSE", epsEstimate: "R28.90", epsPrevious: "R26.45", revenue: "R145.6B" },
  { date: "Feb 6, 2025", symbol: "ABG", company: "Absa Group", exchange: "JSE", epsEstimate: "R21.50", epsPrevious: "R19.80", revenue: "R98.4B" },
  { date: "Feb 7, 2025", symbol: "SCOM", company: "Safaricom", exchange: "NSE", epsEstimate: "KES 1.85", epsPrevious: "KES 1.72", revenue: "KES 320B" },
  { date: "Feb 10, 2025", symbol: "ANG", company: "AngloGold Ashanti", exchange: "JSE", epsEstimate: "$2.45", epsPrevious: "$1.98", revenue: "$5.2B" },
  { date: "Feb 12, 2025", symbol: "BID", company: "Bid Corporation", exchange: "JSE", epsEstimate: "R14.20", epsPrevious: "R13.65", revenue: "R185.2B" },
];

export default function EarningsCalendarPage() {
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
              Earnings Calendar
            </h1>
            <p className="text-muted-foreground">Upcoming company earnings releases</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Company</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Exchange</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">EPS Est.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">EPS Prev.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {earningsData.map((earning, idx) => (
                <tr key={idx} className="hover:bg-terminal-bg-elevated">
                  <td className="px-4 py-4 font-medium">{earning.date}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono font-semibold text-brand-orange">{earning.symbol}</span>
                  </td>
                  <td className="px-4 py-4">{earning.company}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-terminal-bg-elevated">
                      {earning.exchange}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">{earning.epsEstimate}</td>
                  <td className="px-4 py-4 text-right font-mono text-muted-foreground">{earning.epsPrevious}</td>
                  <td className="px-4 py-4 text-right font-mono text-muted-foreground">{earning.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
