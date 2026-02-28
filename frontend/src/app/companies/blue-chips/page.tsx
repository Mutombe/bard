"use client";

import Link from "next/link";
import { Award, TrendingUp, TrendingDown, Building2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanies } from "@/hooks";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `R${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `R${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `R${(value / 1e6).toFixed(1)}M`;
  return `R${value.toLocaleString()}`;
}

export default function BlueChipsPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 40, ordering: "-market_cap" });
  const companies = companiesData?.results || [];

  // Take top 40 by market cap as blue chips
  const blueChips = companies.slice(0, 40);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Award className="h-6 w-6 text-brand-orange" />
            Blue Chip Stocks
          </h1>
          <p className="text-muted-foreground">
            Top 40 largest companies by market capitalization - the most established and stable investments.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Total Companies</p>
            <p className="text-2xl font-bold">{blueChips.length}</p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Total Market Cap</p>
            <p className="text-2xl font-bold">
              {formatMarketCap(blueChips.reduce((sum, c) => sum + (c.market_cap || 0), 0))}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Gainers</p>
            <p className="text-2xl font-bold text-green-500">
              {blueChips.filter(c => (c.price_change_percent || 0) > 0).length}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
            <p className="text-sm text-muted-foreground">Losers</p>
            <p className="text-2xl font-bold text-red-500">
              {blueChips.filter(c => (c.price_change_percent || 0) < 0).length}
            </p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="rounded-lg bg-terminal-bg-elevated border border-terminal-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-terminal-border bg-terminal-bg">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Company</th>
                    <th className="text-right py-3 px-4 font-medium">Price</th>
                    <th className="text-right py-3 px-4 font-medium">Change</th>
                    <th className="text-right py-3 px-4 font-medium">Market Cap</th>
                    <th className="text-right py-3 px-4 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {blueChips.map((company, index) => (
                    <tr
                      key={company.symbol}
                      className="border-b border-terminal-border/50 hover:bg-terminal-bg transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/companies/${company.symbol}`}
                          className="flex items-center gap-3 hover:text-brand-orange"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-brand-orange" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {company.symbol}
                              {index < 10 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {company.name?.slice(0, 30)}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        R{(company.current_price || 0).toFixed(2)}
                      </td>
                      <td className={cn(
                        "text-right py-3 px-4 font-mono",
                        (company.price_change_percent || 0) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}>
                        <span className="flex items-center justify-end gap-1">
                          {(company.price_change_percent || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {(company.price_change_percent || 0) >= 0 ? "+" : ""}
                          {(company.price_change_percent || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatMarketCap(company.market_cap || 0)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                        {(company.volume || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
