"use client";

import Link from "next/link";
import { Calendar, TrendingUp, TrendingDown, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanies } from "@/hooks";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

// Simulated earnings calendar - in production this would come from an API
const earningsCalendar = [
  { symbol: "MTN", name: "MTN Group", date: "2026-02-15", type: "Full Year", estimate: "R12.45", previous: "R11.20" },
  { symbol: "SHP", name: "Shoprite Holdings", date: "2026-02-18", type: "Half Year", estimate: "R8.92", previous: "R8.15" },
  { symbol: "SBK", name: "Standard Bank", date: "2026-02-20", type: "Full Year", estimate: "R22.30", previous: "R20.80" },
  { symbol: "VOD", name: "Vodacom", date: "2026-02-22", type: "Q3", estimate: "R5.60", previous: "R5.25" },
  { symbol: "FSR", name: "FirstRand", date: "2026-02-25", type: "Half Year", estimate: "R6.78", previous: "R6.40" },
  { symbol: "AGL", name: "Anglo American", date: "2026-02-28", type: "Full Year", estimate: "R45.00", previous: "R42.30" },
  { symbol: "NPN", name: "Naspers", date: "2026-03-05", type: "Half Year", estimate: "R85.00", previous: "R78.50" },
  { symbol: "ABG", name: "Absa Group", date: "2026-03-08", type: "Full Year", estimate: "R18.50", previous: "R17.20" },
  { symbol: "BID", name: "Bid Corporation", date: "2026-03-10", type: "Half Year", estimate: "R15.20", previous: "R14.00" },
  { symbol: "WHL", name: "Woolworths Holdings", date: "2026-03-12", type: "Full Year", estimate: "R4.85", previous: "R4.50" },
];

// Recent earnings results
const recentEarnings = [
  { symbol: "IMP", name: "Impala Platinum", date: "2026-01-25", actual: "R8.45", estimate: "R7.90", surprise: "+6.96%" },
  { symbol: "GFI", name: "Gold Fields", date: "2026-01-23", actual: "R12.30", estimate: "R12.50", surprise: "-1.60%" },
  { symbol: "AMS", name: "Anglo American Platinum", date: "2026-01-20", actual: "R95.00", estimate: "R88.00", surprise: "+7.95%" },
  { symbol: "TFG", name: "The Foschini Group", date: "2026-01-18", actual: "R9.80", estimate: "R9.50", surprise: "+3.16%" },
  { symbol: "PIK", name: "Pick n Pay", date: "2026-01-15", actual: "R2.15", estimate: "R2.40", surprise: "-10.42%" },
  { symbol: "MRP", name: "Mr Price", date: "2026-01-12", actual: "R11.50", estimate: "R11.00", surprise: "+4.55%" },
];

export default function EarningsPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 40, ordering: "-market_cap" });
  const companies = companiesData?.results || [];

  // Map companies to get real-time data for earnings calendar
  const getCompanyData = (symbol: string) => {
    return companies.find((c) => c.symbol === symbol);
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-orange" />
            Earnings Calendar
          </h1>
          <p className="text-muted-foreground">
            Track upcoming and recent earnings announcements from African companies.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Beat Estimates</p>
            <p className="text-2xl font-bold text-green-500">67%</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Miss Estimates</p>
            <p className="text-2xl font-bold text-red-500">33%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Earnings */}
          <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              Upcoming Earnings
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {earningsCalendar.map((item) => {
                  const company = getCompanyData(item.symbol);
                  return (
                    <Link
                      key={item.symbol}
                      href={`/companies/${item.symbol}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-terminal-bg hover:bg-terminal-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-brand-orange" />
                        </div>
                        <div>
                          <div className="font-medium">{item.symbol}</div>
                          <div className="text-xs text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(item.date).toLocaleDateString("en-ZA", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.type}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-mono">Est: {item.estimate}</div>
                        <div className="text-xs text-muted-foreground">Prev: {item.previous}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Earnings */}
          <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-brand-orange" />
              Recent Results
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentEarnings.map((item) => {
                  const isBeat = item.surprise.startsWith("+");
                  return (
                    <Link
                      key={item.symbol}
                      href={`/companies/${item.symbol}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-terminal-bg hover:bg-terminal-bg/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-brand-orange" />
                        </div>
                        <div>
                          <div className="font-medium">{item.symbol}</div>
                          <div className="text-xs text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">Act: {item.actual}</div>
                        <div className="text-xs text-muted-foreground">Est: {item.estimate}</div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 font-medium",
                        isBeat ? "text-green-500" : "text-red-500"
                      )}>
                        {isBeat ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {item.surprise}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
