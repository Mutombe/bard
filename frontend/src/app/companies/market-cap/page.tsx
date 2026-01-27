"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, TrendingDown, Building2 } from "lucide-react";
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

const marketCapCategories = [
  { name: "Mega Cap", min: 200e9, description: "Over R200 billion" },
  { name: "Large Cap", min: 50e9, max: 200e9, description: "R50B - R200B" },
  { name: "Mid Cap", min: 10e9, max: 50e9, description: "R10B - R50B" },
  { name: "Small Cap", min: 2e9, max: 10e9, description: "R2B - R10B" },
  { name: "Micro Cap", max: 2e9, description: "Under R2 billion" },
];

export default function MarketCapPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 100, ordering: "-market_cap" });
  const companies = companiesData?.results || [];

  const categorizedCompanies = marketCapCategories.map((category) => {
    const filtered = companies.filter((c) => {
      const cap = c.market_cap || 0;
      const meetsMin = category.min ? cap >= category.min : true;
      const meetsMax = category.max ? cap < category.max : true;
      return meetsMin && meetsMax;
    });
    return { ...category, companies: filtered };
  });

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-orange" />
            Companies by Market Cap
          </h1>
          <p className="text-muted-foreground">
            African companies ranked by market capitalization.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {categorizedCompanies.map((category) => (
              <div
                key={category.name}
                className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description} • {category.companies.length} companies
                    </p>
                  </div>
                </div>

                {category.companies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-terminal-border">
                          <th className="text-left py-2 font-medium">Company</th>
                          <th className="text-right py-2 font-medium">Price</th>
                          <th className="text-right py-2 font-medium">Change</th>
                          <th className="text-right py-2 font-medium">Market Cap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.companies.slice(0, 10).map((company) => (
                          <tr
                            key={company.symbol}
                            className="border-b border-terminal-border/50 hover:bg-terminal-bg transition-colors"
                          >
                            <td className="py-3">
                              <Link
                                href={`/companies/${company.symbol}`}
                                className="flex items-center gap-2 hover:text-brand-orange"
                              >
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <span className="font-medium">{company.symbol}</span>
                                  <span className="text-muted-foreground ml-2 hidden md:inline">
                                    {company.name?.slice(0, 25)}
                                  </span>
                                </div>
                              </Link>
                            </td>
                            <td className="text-right py-3 font-mono">
                              R{(company.current_price || 0).toFixed(2)}
                            </td>
                            <td className={cn(
                              "text-right py-3 font-mono",
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
                            <td className="text-right py-3 font-mono">
                              {formatMarketCap(company.market_cap || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No companies in this category
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
