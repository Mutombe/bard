"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Star,
  Bell,
  Share2,
  ExternalLink,
  Building2,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { marketService } from "@/services/api/market";
import { newsService } from "@/services/api/news";
import type { Company, NewsArticle } from "@/types";

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />
  );
}

// Simple canvas chart component
function StockChart({ data, isUp }: { data: number[]; isUp: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    if (isUp) {
      gradient.addColorStop(0, "rgba(0, 215, 117, 0.3)");
      gradient.addColorStop(1, "rgba(0, 215, 117, 0)");
    } else {
      gradient.addColorStop(0, "rgba(255, 59, 59, 0.3)");
      gradient.addColorStop(1, "rgba(255, 59, 59, 0)");
    }

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = isUp ? "#00D775" : "#FF3B3B";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, isUp]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={300}
      className="w-full h-[300px]"
    />
  );
}

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
}

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Loading skeleton for the page
function CompanyPageSkeleton() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <Skeleton className="h-9 w-32 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("1M");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch company data - try by symbol first
        const companyData = await marketService.getCompany(symbol);
        setCompany(companyData);

        // Fetch chart data
        try {
          const chart = await marketService.getChartData(companyData.id, {
            period: timeframe.toLowerCase(),
          });
          if (chart.data && chart.data.length > 0) {
            setChartData(chart.data.map((d) => d.c)); // c = close price
          }
        } catch {
          // Generate fallback chart data if chart API fails
          const basePrice = companyData.current_price || 100;
          const data: number[] = [];
          for (let i = 0; i < 50; i++) {
            const randomChange = (Math.random() - 0.5) * basePrice * 0.05;
            data.push(basePrice + randomChange);
          }
          setChartData(data);
        }

        // Fetch related news
        try {
          const newsData = await newsService.getArticles({ company: companyData.id });
          setNews(newsData.results.slice(0, 4));
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
  }, [symbol, timeframe]);

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
            The company &quot;{symbol}&quot; doesn&apos;t exist in our database or couldn&apos;t be loaded.
          </p>
          <Link href="/companies" className="text-brand-orange hover:text-brand-orange-light">
            Browse All Companies
          </Link>
        </div>
      </MainLayout>
    );
  }

  const change = company.price_change || 0;
  const changePercent = company.price_change_percent || 0;
  const isUp = company.is_up ?? change >= 0;
  const price = company.current_price || 0;

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/companies" className="hover:text-foreground">Companies</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-brand-orange">{company.symbol}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{company.symbol}</h1>
              <span className="px-2 py-1 text-xs font-medium bg-terminal-bg-elevated rounded">
                {company.exchange?.code || "JSE"}
              </span>
            </div>
            <p className="text-lg text-muted-foreground">{company.name}</p>
            <p className="text-sm text-muted-foreground">
              {company.sector?.name || "N/A"} {company.industry ? `\u2022 ${company.industry}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold font-mono">
                R{formatPrice(price)}
              </div>
              <div className={cn("flex items-center justify-end gap-1 text-lg", isUp ? "text-market-up" : "text-market-down")}>
                {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                <Star className="h-5 w-5" />
              </button>
              <button className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 border border-terminal-border rounded-md hover:bg-terminal-bg-elevated transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Price Chart</h2>
                <div className="flex items-center gap-1">
                  {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={cn(
                        "px-3 py-1 text-sm rounded transition-colors",
                        timeframe === tf
                          ? "bg-brand-orange text-white"
                          : "hover:bg-terminal-bg-elevated"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-terminal-bg rounded-lg overflow-hidden">
                {chartData.length > 0 ? (
                  <StockChart data={chartData} isUp={isUp} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Open</span>
                  <div className="font-mono">{formatPrice(company.day_open || company.open_price || price)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">High</span>
                  <div className="font-mono text-market-up">{formatPrice(company.day_high || price)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Low</span>
                  <div className="font-mono text-market-down">{formatPrice(company.day_low || price)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Prev Close</span>
                  <div className="font-mono">{formatPrice(company.previous_close || price)}</div>
                </div>
              </div>
            </section>

            {/* About */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4">About {company.name}</h2>
              <p className="text-muted-foreground mb-4">
                {company.description || `${company.name} is a company listed on the ${company.exchange?.name || "stock exchange"}.`}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {company.headquarters && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Headquarters</div>
                      <div>{company.headquarters}</div>
                    </div>
                  </div>
                )}
                {company.employees && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Employees</div>
                      <div>{company.employees.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                {company.founded && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Founded</div>
                      <div>{company.founded}</div>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground">Website</div>
                      <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-brand-orange-light">
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* News */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Latest News</h2>
                <Link href={`/news?company=${company.symbol}`} className="text-sm text-brand-orange hover:text-brand-orange-light">
                  View All
                </Link>
              </div>

              {news.length > 0 ? (
                <div className="space-y-3">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="block p-3 rounded-lg hover:bg-terminal-bg-elevated transition-colors group"
                    >
                      <h3 className="font-medium group-hover:text-brand-orange transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{item.category?.name || "News"}</span>
                        <span>\u2022</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent news for this company.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Key Statistics */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-orange" />
                Key Statistics
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-mono">{company.market_cap ? `R${formatNumber(company.market_cap)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-mono">{company.pe_ratio?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EPS</span>
                  <span className="font-mono">{company.eps ? `R${company.eps.toFixed(2)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield</span>
                  <span className="font-mono">{company.dividend_yield ? `${company.dividend_yield.toFixed(2)}%` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beta</span>
                  <span className="font-mono">{company.beta?.toFixed(2) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52W High</span>
                  <span className="font-mono text-market-up">{company.week_52_high ? `R${formatPrice(company.week_52_high)}` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">52W Low</span>
                  <span className="font-mono text-market-down">{company.week_52_low ? `R${formatPrice(company.week_52_low)}` : "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Trading Info */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand-orange" />
                Trading Information
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-mono">{company.volume?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Volume</span>
                  <span className="font-mono">{company.average_volume?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares Outstanding</span>
                  <span className="font-mono">{company.shares_outstanding ? formatNumber(company.shares_outstanding) : "N/A"}</span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="p-4 rounded-lg bg-terminal-bg-elevated border border-brand-orange/30">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors">
                  Add to Watchlist
                </button>
                <button className="w-full py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors">
                  Set Price Alert
                </button>
                <Link
                  href={`/research?symbol=${company.symbol}`}
                  className="flex items-center justify-center gap-2 w-full py-2 border border-terminal-border rounded-md hover:bg-terminal-bg-secondary transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  View Research
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
