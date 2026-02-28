"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingDown, ArrowLeft, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { marketService } from "@/services/api/market";

export default function LosersPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLosers() {
      try {
        const response = await marketService.getCompanies({
          ordering: "change_percent",
          page_size: 20,
        });
        setCompanies(response.results || []);
      } catch (error) {
        console.error("Failed to fetch losers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLosers();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/markets" className="p-2 hover:bg-terminal-bg-secondary rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="h-6 w-6 text-market-down" />
              Top Losers
            </h1>
            <p className="text-muted-foreground">Biggest decliners today</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        ) : (
          <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-terminal-bg border-b border-terminal-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Company</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Change</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">% Change</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border">
                {companies.map((company, index) => (
                  <tr key={company.symbol} className="hover:bg-terminal-bg-elevated">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">{index + 1}</span>
                        <Link href={`/companies/${company.symbol}`} className="font-mono font-semibold text-brand-orange hover:underline">
                          {company.symbol}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{company.name}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {parseFloat(company.current_price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-market-down">
                      {parseFloat(company.change || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 bg-market-down/20 text-market-down rounded text-sm font-mono">
                        {parseFloat(company.change_percent || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                      {(company.volume || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
