"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PieChart, ArrowLeft, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { marketService } from "@/services/api/market";

export default function SectorsPage() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSectors() {
      try {
        const data = await marketService.getSectors();
        setSectors(data || []);
      } catch (error) {
        console.error("Failed to fetch sectors:", error);
        // Fallback to mock data
        setSectors([
          { name: "Financials", slug: "financials", change_percent: 2.34, companies_count: 45, market_cap: "R2.5T" },
          { name: "Mining", slug: "mining", change_percent: -1.23, companies_count: 32, market_cap: "R1.8T" },
          { name: "Technology", slug: "technology", change_percent: 3.45, companies_count: 28, market_cap: "R890B" },
          { name: "Consumer Goods", slug: "consumer-goods", change_percent: 0.56, companies_count: 56, market_cap: "R1.2T" },
          { name: "Healthcare", slug: "healthcare", change_percent: 1.89, companies_count: 22, market_cap: "R450B" },
          { name: "Energy", slug: "energy", change_percent: -0.78, companies_count: 18, market_cap: "R680B" },
          { name: "Telecommunications", slug: "telecom", change_percent: 0.34, companies_count: 12, market_cap: "R920B" },
          { name: "Real Estate", slug: "real-estate", change_percent: -2.11, companies_count: 35, market_cap: "R340B" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSectors();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PieChart className="h-6 w-6 text-brand-orange" />
              Market Sectors
            </h1>
            <p className="text-muted-foreground">Sector performance overview</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sectors.map((sector) => {
              const isUp = (sector.change_percent || 0) >= 0;
              return (
                <Link
                  key={sector.slug}
                  href={`/companies?sector=${sector.slug}`}
                  className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6 hover:border-brand-orange/50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{sector.name}</h3>
                  <div className={cn(
                    "flex items-center gap-1 text-2xl font-mono mb-3",
                    isUp ? "text-market-up" : "text-market-down"
                  )}>
                    {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {isUp ? "+" : ""}{(sector.change_percent || 0).toFixed(2)}%
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{sector.companies_count || 0} companies</span>
                    <span>{sector.market_cap || "N/A"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
