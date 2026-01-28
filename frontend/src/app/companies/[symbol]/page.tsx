"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { marketService } from "@/services/api/market";
import { newsService } from "@/services/api/news";
import { ProfessionalChart, generateChartData } from "@/components/charts/ProfessionalChart";
import { StockActions } from "@/components/stock/StockActions";
import type { Company, NewsArticle } from "@/types";

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />
  );
}

// Currency helper for African exchanges
function getCurrencySymbol(exchangeCode?: string): { symbol: string; code: string } {
  const currencies: Record<string, { symbol: string; code: string }> = {
    "JSE": { symbol: "R", code: "ZAR" },       // South Africa - Rand
    "ZSE": { symbol: "ZiG", code: "ZIG" },     // Zimbabwe Stock Exchange - ZiG (Zimbabwe Gold)
    "VFEX": { symbol: "$", code: "USD" },      // Victoria Falls Exchange - USD
    "VFX": { symbol: "$", code: "USD" },       // Victoria Falls Exchange (alt code)
    "BSE": { symbol: "P", code: "BWP" },       // Botswana - Pula
    "NSE": { symbol: "₦", code: "NGN" },       // Nigeria - Naira
    "NGX": { symbol: "₦", code: "NGN" },       // Nigeria (new code)
    "EGX": { symbol: "E£", code: "EGP" },      // Egypt - Pound
    "GSE": { symbol: "₵", code: "GHS" },       // Ghana - Cedi
    "NSE_KE": { symbol: "KSh", code: "KES" },  // Kenya - Shilling
    "BRVM": { symbol: "CFA", code: "XOF" },    // West Africa - CFA Franc
    "LuSE": { symbol: "K", code: "ZMW" },      // Zambia - Kwacha
    "DSE": { symbol: "TSh", code: "TZS" },     // Tanzania - Shilling
  };
  return currencies[exchangeCode || "JSE"] || { symbol: "R", code: "ZAR" };
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "-";
  return Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Time ago helper
function timeAgo(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Loading skeleton for the page
function CompanyPageSkeleton() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="text-right">
            <Skeleton className="h-10 w-40 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[400px] w-full rounded-lg mb-6" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [timeframe, setTimeframe] = useState<string>("1M");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch company details
        const companyData = await marketService.getCompanyBySymbol(symbol);
        setCompany(companyData);

        // Fetch related news
        try {
          const newsData = await newsService.getArticles({});
          setNews(newsData.results?.slice(0, 5) || []);
        } catch {
          setNews([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch company:", err);
        setError(err.message || "Company not found");
      } finally {
        setIsLoading(false);
      }
    }

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  // Get timeframe days mapping
  const getTimeframeDays = (tf: string): number => {
    const mapping: Record<string, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "YTD": Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
      "1Y": 365,
      "5Y": 1825,
      "ALL": 3650,
    };
    return mapping[tf] || 30;
  };

  // Generate chart data based on timeframe
  const chartData = useMemo(() => {
    if (!company) return [];
    const basePrice = toNumber(company.current_price);
    const changePercent = toNumber(company.price_change_percent);
    const days = getTimeframeDays(timeframe);
    // Calculate trend based on price change
    const trend = changePercent / 100 * (days / 30);
    return generateChartData(basePrice, days, 0.02, trend);
  }, [company, timeframe]);

  if (isLoading) {
    return <CompanyPageSkeleton />;
  }

  if (error || !company) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-market-down mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The company &quot;{symbol}&quot; doesn&apos;t exist or couldn&apos;t be loaded.
          </p>
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orange-light"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse All Companies
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Safely convert all numeric values
  const price = toNumber(company.current_price);
  const change = toNumber(company.price_change);
  const changePercent = toNumber(company.price_change_percent);
  const isUp = changePercent >= 0;
  const dayOpen = toNumber(company.day_open) || price * 0.998;
  const prevClose = toNumber(company.previous_close) || price - change;
  const dayHigh = toNumber(company.day_high) || price * 1.01;
  const dayLow = toNumber(company.day_low) || price * 0.99;
  const week52High = toNumber(company.week_52_high) || price * 1.2;
  const week52Low = toNumber(company.week_52_low) || price * 0.8;
  const marketCap = toNumber(company.market_cap);
  const peRatio = toNumber(company.pe_ratio);
  const volume = toNumber(company.volume);
  const avgVolume = toNumber(company.average_volume) || volume;

  // Determine currency based on exchange
  const currencyInfo = getCurrencySymbol(company.exchange?.code);
  const currency = currencyInfo.symbol;

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/markets" className="hover:text-foreground">Markets</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/companies" className="hover:text-foreground">Companies</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{company.symbol}</span>
        </nav>

        {/* Header - Bloomberg style */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{company.name || company.symbol}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">{company.symbol}</span>
              <span>:</span>
              <span>{company.exchange?.code || "JSE"}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{currencyInfo.code}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-market-up">Market Open</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl font-bold font-mono">
                {currency}{formatPrice(price)}
              </div>
              <div className={cn(
                "flex items-center justify-end gap-2 text-lg font-semibold",
                isUp ? "text-market-up" : "text-market-down"
              )}>
                {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{isUp ? "+" : ""}{change.toFixed(2)}</span>
                <span>({isUp ? "+" : ""}{changePercent.toFixed(2)}%)</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                As of {new Date().toLocaleTimeString()}
              </div>
            </div>

            <StockActions company={company} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Chart & News */}
          <div className="lg:col-span-3 space-y-6">
            {/* Professional TradingView-style Chart */}
            {chartData.length > 0 ? (
              <ProfessionalChart
                symbol={company.symbol}
                data={chartData}
                currency={currency}
                height={500}
                showVolume={true}
                showToolbar={true}
                onTimeframeChange={setTimeframe}
              />
            ) : (
              <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Loading chart data...
                </div>
              </section>
            )}

            {/* Quick Stats Row */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Open</div>
                  <div className="font-mono font-semibold">{currency}{formatPrice(dayOpen)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prev. Close</div>
                  <div className="font-mono font-semibold">{currency}{formatPrice(prevClose)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Day Range</div>
                  <div className="font-mono text-sm">
                    <span className="text-red-500">{currency}{formatPrice(dayLow)}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-green-500">{currency}{formatPrice(dayHigh)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">52 Week Range</div>
                  <div className="font-mono text-sm">
                    <span className="text-red-500">{currency}{formatPrice(week52Low)}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-green-500">{currency}{formatPrice(week52High)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Related News */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Related News
              </h2>
              {news.length > 0 ? (
                <div className="space-y-3">
                  {news.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="block p-3 rounded-lg hover:bg-terminal-bg-elevated transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium group-hover:text-brand-orange transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {article.excerpt}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgo(article.published_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No related news available</p>
              )}
            </section>
          </div>

          {/* Sidebar - Key Stats */}
          <div className="space-y-6">
            {/* Key Statistics */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4">Key Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Market Cap</span>
                  <span className="font-mono">{marketCap ? currency + formatNumber(marketCap) : "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">P/E Ratio</span>
                  <span className="font-mono">{peRatio ? peRatio.toFixed(2) : "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <span className="font-mono">{volume ? formatNumber(volume) : "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Avg. Volume</span>
                  <span className="font-mono">{avgVolume ? formatNumber(avgVolume) : "-"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Day High</span>
                  <span className="font-mono">{currency}{formatPrice(dayHigh)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Day Low</span>
                  <span className="font-mono">{currency}{formatPrice(dayLow)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">52W High</span>
                  <span className="font-mono">{currency}{formatPrice(week52High)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">52W Low</span>
                  <span className="font-mono">{currency}{formatPrice(week52Low)}</span>
                </div>
              </div>
            </section>

            {/* Company Info */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4">Company Info</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Exchange</span>
                  <span>{company.exchange?.name || company.exchange?.code || "JSE"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                  <span className="text-sm text-muted-foreground">Sector</span>
                  <span>{company.sector?.name || "-"}</span>
                </div>
                {company.industry && (
                  <div className="flex justify-between items-center py-2 border-b border-terminal-border">
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <span className="text-right max-w-[150px] truncate">{company.industry}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span>{currencyInfo.code} ({currency})</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
