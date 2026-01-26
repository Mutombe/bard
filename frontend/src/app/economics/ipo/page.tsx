"use client";

import Link from "next/link";
import { TrendingUp, ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

const ipoData = [
  { company: "Afreximbank", symbol: "AFREXIM", exchange: "JSE", expectedDate: "Q1 2025", priceRange: "$25-30", valuation: "$15B", sector: "Financial Services" },
  { company: "Flutterwave", symbol: "FLW", exchange: "NGX", expectedDate: "Q2 2025", priceRange: "₦2,500-3,000", valuation: "$3B", sector: "Fintech" },
  { company: "OPay", symbol: "OPAY", exchange: "NGX", expectedDate: "Q2 2025", priceRange: "TBD", valuation: "$2.5B", sector: "Fintech" },
  { company: "Chipper Cash", symbol: "CHIP", exchange: "NSE", expectedDate: "Q3 2025", priceRange: "TBD", valuation: "$2B", sector: "Fintech" },
  { company: "M-KOPA", symbol: "MKOPA", exchange: "NSE", expectedDate: "Q2 2025", priceRange: "KES 450-550", valuation: "$1B", sector: "Clean Energy" },
  { company: "Andela", symbol: "ANDL", exchange: "NGX", expectedDate: "Q3 2025", priceRange: "TBD", valuation: "$1.5B", sector: "Technology" },
  { company: "Interswitch", symbol: "INTER", exchange: "NGX", expectedDate: "Q1 2025", priceRange: "₦1,800-2,200", valuation: "$1.5B", sector: "Fintech" },
  { company: "Kobo360", symbol: "KOBO", exchange: "NGX", expectedDate: "Q4 2025", priceRange: "TBD", valuation: "$600M", sector: "Logistics" },
];

export default function IPOCalendarPage() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/economics" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-brand-orange" />
              IPO Calendar
            </h1>
            <p className="text-muted-foreground">Upcoming Initial Public Offerings</p>
          </div>
        </div>

        <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-terminal-bg border-b border-terminal-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Exchange</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Sector</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Expected</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price Range</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border">
              {ipoData.map((ipo, idx) => (
                <tr key={idx} className="hover:bg-terminal-bg-elevated">
                  <td className="px-4 py-4 font-medium">{ipo.company}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono font-semibold text-brand-orange">{ipo.symbol}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-terminal-bg-elevated">
                      {ipo.exchange}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{ipo.sector}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {ipo.expectedDate}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">{ipo.priceRange}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-market-up">
                      <DollarSign className="h-3 w-3" />
                      {ipo.valuation}
                    </span>
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
