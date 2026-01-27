"use client";

import Link from "next/link";
import { DollarSign, TrendingUp, Building2, Calendar, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanies } from "@/hooks";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

// Simulated dividend data - in production this would come from an API
const upcomingDividends = [
  { symbol: "SBK", name: "Standard Bank", exDate: "2026-02-10", payDate: "2026-02-24", amount: "R8.50", yield: "5.2%" },
  { symbol: "FSR", name: "FirstRand", exDate: "2026-02-12", payDate: "2026-02-26", amount: "R3.20", yield: "4.8%" },
  { symbol: "ABG", name: "Absa Group", exDate: "2026-02-15", payDate: "2026-03-01", amount: "R7.80", yield: "5.5%" },
  { symbol: "NED", name: "Nedbank", exDate: "2026-02-18", payDate: "2026-03-04", amount: "R11.50", yield: "5.1%" },
  { symbol: "SHP", name: "Shoprite Holdings", exDate: "2026-02-20", payDate: "2026-03-06", amount: "R4.65", yield: "2.8%" },
  { symbol: "MTN", name: "MTN Group", exDate: "2026-02-25", payDate: "2026-03-11", amount: "R3.30", yield: "4.2%" },
  { symbol: "VOD", name: "Vodacom", exDate: "2026-03-01", payDate: "2026-03-15", amount: "R4.85", yield: "5.8%" },
  { symbol: "BID", name: "Bid Corporation", exDate: "2026-03-05", payDate: "2026-03-19", amount: "R6.20", yield: "2.4%" },
];

// Top dividend yielding stocks
const highYieldStocks = [
  { symbol: "VOD", name: "Vodacom", yield: "5.8%", annualDiv: "R9.70", payout: "82%" },
  { symbol: "ABG", name: "Absa Group", yield: "5.5%", annualDiv: "R15.60", payout: "54%" },
  { symbol: "SBK", name: "Standard Bank", yield: "5.2%", annualDiv: "R17.00", payout: "52%" },
  { symbol: "NED", name: "Nedbank", yield: "5.1%", annualDiv: "R23.00", payout: "55%" },
  { symbol: "FSR", name: "FirstRand", yield: "4.8%", annualDiv: "R6.40", payout: "56%" },
  { symbol: "INL", name: "Investec", yield: "4.5%", annualDiv: "R5.80", payout: "48%" },
  { symbol: "RMH", name: "RMB Holdings", yield: "4.3%", annualDiv: "R2.50", payout: "45%" },
  { symbol: "MTN", name: "MTN Group", yield: "4.2%", annualDiv: "R6.60", payout: "58%" },
];

// Dividend aristocrats (consistent dividend growers)
const dividendAristocrats = [
  { symbol: "SHP", name: "Shoprite Holdings", years: 15, growth: "8.5%", streak: "Unbroken" },
  { symbol: "SBK", name: "Standard Bank", years: 12, growth: "6.2%", streak: "Unbroken" },
  { symbol: "BID", name: "Bid Corporation", years: 10, growth: "12.3%", streak: "Unbroken" },
  { symbol: "WHL", name: "Woolworths Holdings", years: 9, growth: "5.8%", streak: "Unbroken" },
  { symbol: "TFG", name: "The Foschini Group", years: 8, growth: "7.4%", streak: "Unbroken" },
  { symbol: "PIK", name: "Pick n Pay", years: 7, growth: "4.2%", streak: "Unbroken" },
];

export default function DividendsPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 40, ordering: "-market_cap" });
  const companies = companiesData?.results || [];

  const getCompanyData = (symbol: string) => {
    return companies.find((c) => c.symbol === symbol);
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-brand-orange" />
            Dividends
          </h1>
          <p className="text-muted-foreground">
            Track dividend payments, yields, and income opportunities across African markets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Avg JSE Yield</p>
            <p className="text-2xl font-bold">3.8%</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Ex-Div This Week</p>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Highest Yield</p>
            <p className="text-2xl font-bold text-green-500">5.8%</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Dividend Growers</p>
            <p className="text-2xl font-bold">24</p>
          </div>
        </div>

        {/* Upcoming Dividends */}
        <div className="mb-6 p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-orange" />
            Upcoming Ex-Dividend Dates
          </h2>

          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-terminal-border">
                    <th className="text-left py-2 font-medium">Company</th>
                    <th className="text-right py-2 font-medium">Ex-Date</th>
                    <th className="text-right py-2 font-medium">Pay Date</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-right py-2 font-medium">Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDividends.map((item) => (
                    <tr
                      key={item.symbol}
                      className="border-b border-terminal-border/50 hover:bg-terminal-bg transition-colors"
                    >
                      <td className="py-3">
                        <Link
                          href={`/companies/${item.symbol}`}
                          className="flex items-center gap-2 hover:text-brand-orange"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{item.symbol}</span>
                            <span className="text-muted-foreground ml-2 hidden md:inline">
                              {item.name}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-3 font-mono">
                        {new Date(item.exDate).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="text-right py-3 font-mono text-muted-foreground">
                        {new Date(item.payDate).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="text-right py-3 font-mono">{item.amount}</td>
                      <td className="text-right py-3 font-mono text-green-500">{item.yield}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* High Yield Stocks */}
          <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-brand-orange" />
              Highest Dividend Yields
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {highYieldStocks.map((item, index) => (
                  <Link
                    key={item.symbol}
                    href={`/companies/${item.symbol}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-terminal-bg hover:bg-terminal-bg/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-bold text-green-500">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-500">{item.yield}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.annualDiv}/yr • {item.payout} payout
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dividend Aristocrats */}
          <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-orange" />
              Dividend Growth Leaders
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Companies with consistent dividend growth track records.
            </p>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {dividendAristocrats.map((item) => (
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
                      <div className="text-sm">
                        <span className="text-green-500 font-medium">{item.years} years</span>
                        <span className="text-muted-foreground"> consecutive</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg growth: {item.growth}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
