"use client";

import { useState } from "react";
import Link from "next/link";
import { PieChart, TrendingUp, TrendingDown, Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanies } from "@/hooks";

// Sector definitions with colors
const sectors = [
  { name: "Financials", code: "financials", color: "#3B82F6", icon: "🏦" },
  { name: "Mining", code: "mining", color: "#F59E0B", icon: "⛏️" },
  { name: "Retail", code: "retail", color: "#10B981", icon: "🛒" },
  { name: "Telecommunications", code: "telecom", color: "#8B5CF6", icon: "📱" },
  { name: "Healthcare", code: "healthcare", color: "#EC4899", icon: "🏥" },
  { name: "Energy", code: "energy", color: "#EF4444", icon: "⚡" },
  { name: "Consumer Goods", code: "consumer", color: "#06B6D4", icon: "🛍️" },
  { name: "Industrials", code: "industrials", color: "#6366F1", icon: "🏭" },
  { name: "Technology", code: "technology", color: "#14B8A6", icon: "💻" },
  { name: "Real Estate", code: "realestate", color: "#F97316", icon: "🏢" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

export default function SectorsPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 100 });
  const companies = companiesData?.results || [];

  // Group companies by sector (simulated based on company characteristics)
  const getSectorForCompany = (symbol: string): string => {
    const sectorMap: Record<string, string> = {
      ABG: "financials", SBK: "financials", FSR: "financials", NED: "financials", INL: "financials",
      AGL: "mining", AMS: "mining", IMP: "mining", S32: "mining", GFI: "mining",
      SHP: "retail", WHL: "retail", TFG: "retail", MRP: "retail", PIK: "retail",
      MTN: "telecom", VOD: "telecom", TKG: "telecom",
      APN: "healthcare", DIS: "healthcare", NTC: "healthcare",
      SOL: "energy", SAS: "energy", ENX: "energy",
      BTI: "consumer", AVI: "consumer", TBS: "consumer",
      BID: "industrials", MNP: "industrials", WBO: "industrials",
      NPN: "technology", PRX: "technology",
      GRT: "realestate", RES: "realestate", HYP: "realestate",
    };
    return sectorMap[symbol] || "industrials";
  };

  const sectorData = sectors.map((sector) => {
    const sectorCompanies = companies.filter(
      (c) => getSectorForCompany(c.symbol) === sector.code
    );
    const totalMarketCap = sectorCompanies.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const avgChange = sectorCompanies.length > 0
      ? sectorCompanies.reduce((sum, c) => sum + ((c.price_change_percent || 0) || 0), 0) / sectorCompanies.length
      : 0;

    return {
      ...sector,
      companies: sectorCompanies,
      count: sectorCompanies.length,
      marketCap: totalMarketCap,
      change: avgChange,
    };
  }).sort((a, b) => b.marketCap - a.marketCap);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <PieChart className="h-6 w-6 text-brand-orange" />
            Companies by Sector
          </h1>
          <p className="text-muted-foreground">
            Explore African companies organized by industry sector.
          </p>
        </div>

        {/* Sectors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectorData.map((sector) => (
              <div
                key={sector.code}
                className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border hover:border-brand-orange/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sector.icon}</span>
                    <div>
                      <h3 className="font-semibold">{sector.name}</h3>
                      <p className="text-sm text-muted-foreground">{sector.count} companies</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    sector.change >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {sector.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(sector.change).toFixed(2)}%
                  </div>
                </div>

                {/* Top Companies in Sector */}
                <div className="space-y-2 mb-4">
                  {sector.companies.slice(0, 3).map((company) => (
                    <Link
                      key={company.symbol}
                      href={`/companies/${company.symbol}`}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-terminal-bg transition-colors"
                    >
                      <span className="text-sm font-medium">{company.symbol}</span>
                      <span className={cn(
                        "text-sm",
                        (company.price_change_percent || 0) >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {(company.price_change_percent || 0) >= 0 ? "+" : ""}
                        {(company.price_change_percent || 0).toFixed(2)}%
                      </span>
                    </Link>
                  ))}
                </div>

                <Link
                  href={`/companies?sector=${sector.code}`}
                  className="flex items-center justify-center gap-1 text-sm text-brand-orange hover:text-brand-orange-light"
                >
                  View all {sector.name} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
