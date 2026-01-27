"use client";

import Link from "next/link";
import { FileText, Download, Building2, Calendar, ExternalLink, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanies } from "@/hooks";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />;
}

// Simulated company reports - in production this would come from an API
const recentReports = [
  {
    symbol: "SBK",
    name: "Standard Bank",
    title: "Full Year Results 2025",
    type: "Annual Results",
    date: "2026-01-25",
    highlights: ["HEPS up 12%", "ROE 18.5%", "Final dividend R9.50"]
  },
  {
    symbol: "MTN",
    name: "MTN Group",
    title: "Trading Statement Q4 2025",
    type: "Trading Statement",
    date: "2026-01-22",
    highlights: ["Service revenue +8%", "MoMo users 68M", "Data revenue +15%"]
  },
  {
    symbol: "SHP",
    name: "Shoprite Holdings",
    title: "Half Year Results FY2026",
    type: "Interim Results",
    date: "2026-01-20",
    highlights: ["Sales +9.2%", "Trading profit +11%", "Market share gains"]
  },
  {
    symbol: "AGL",
    name: "Anglo American",
    title: "Production Report Q4 2025",
    type: "Quarterly Report",
    date: "2026-01-18",
    highlights: ["Copper +5%", "Iron ore stable", "Cost guidance maintained"]
  },
  {
    symbol: "NPN",
    name: "Naspers",
    title: "NAV Update January 2026",
    type: "NAV Report",
    date: "2026-01-15",
    highlights: ["NAV per share R4,850", "Discount to NAV 45%", "Buybacks continue"]
  },
  {
    symbol: "FSR",
    name: "FirstRand",
    title: "Capital Markets Day Presentation",
    type: "Investor Presentation",
    date: "2026-01-12",
    highlights: ["Digital strategy update", "Aldermore integration", "Africa expansion"]
  },
];

// Categories of reports
const reportCategories = [
  { name: "Annual Results", count: 45, icon: BarChart3, color: "text-blue-500" },
  { name: "Interim Results", count: 38, icon: TrendingUp, color: "text-green-500" },
  { name: "Trading Statements", count: 62, icon: FileText, color: "text-orange-500" },
  { name: "Investor Presentations", count: 28, icon: ExternalLink, color: "text-purple-500" },
];

export default function ReportsPage() {
  const { data: companiesData, isLoading } = useCompanies({ page_size: 40, ordering: "-market_cap" });
  const companies = companiesData?.results || [];

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand-orange" />
            Company Reports
          </h1>
          <p className="text-muted-foreground">
            Access financial reports, presentations, and disclosures from listed companies.
          </p>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {reportCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="p-4 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-5 w-5", category.color)} />
                  <p className="text-sm font-medium">{category.name}</p>
                </div>
                <p className="text-2xl font-bold">{category.count}</p>
                <p className="text-xs text-muted-foreground">reports available</p>
              </div>
            );
          })}
        </div>

        {/* Recent Reports */}
        <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border mb-6">
          <h2 className="text-lg font-semibold mb-4">Latest Reports</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={`${report.symbol}-${report.date}`}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-terminal-bg hover:bg-terminal-bg/80 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-brand-orange" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/companies/${report.symbol}`}
                          className="font-semibold hover:text-brand-orange"
                        >
                          {report.symbol}
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{report.name}</span>
                      </div>
                      <h3 className="font-medium mb-2">{report.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {report.highlights.map((highlight, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-terminal-bg-elevated rounded-full text-muted-foreground"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm text-brand-orange">{report.type}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-md hover:bg-brand-orange hover:text-white transition-colors text-sm">
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browse by Company */}
        <div className="p-5 rounded-lg bg-terminal-bg-elevated border border-terminal-border">
          <h2 className="text-lg font-semibold mb-4">Browse by Company</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a company to view all their financial reports and disclosures.
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {companies.slice(0, 24).map((company) => (
                <Link
                  key={company.symbol}
                  href={`/companies/${company.symbol}`}
                  className="flex items-center gap-2 p-3 rounded-lg bg-terminal-bg hover:bg-brand-orange/10 hover:text-brand-orange transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-terminal-bg-elevated flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{company.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {company.name?.slice(0, 15)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
