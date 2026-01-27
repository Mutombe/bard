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
  Calendar,
  Clock,
  AlertCircle,
  ArrowLeft,
  Info,
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

// Bloomberg-style stock chart with timeline
function StockChart({
  data,
  isUp,
  timeLabels,
  currency = "R"
}: {
  data: number[];
  isUp: boolean;
  timeLabels?: string[];
  currency?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; label?: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get actual canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 40, left: 20 };

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data) * 0.998;
    const max = Math.max(...data) * 1.002;
    const range = max - min || 1;

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * (height - padding.top - padding.bottom);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels on right
      const priceValue = max - (i / 4) * range;
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(priceValue.toFixed(2), width - padding.right + 5, y + 4);
    }

    // Draw area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    if (isUp) {
      gradient.addColorStop(0, "rgba(0, 215, 117, 0.2)");
      gradient.addColorStop(1, "rgba(0, 215, 117, 0)");
    } else {
      gradient.addColorStop(0, "rgba(255, 59, 59, 0.2)");
      gradient.addColorStop(1, "rgba(255, 59, 59, 0)");
    }

    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);

    data.forEach((value, index) => {
      const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
      const y = padding.top + ((max - value) / range) * (height - padding.top - padding.bottom);
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
      const y = padding.top + ((max - value) / range) * (height - padding.top - padding.bottom);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = isUp ? "#00D775" : "#FF3B3B";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw time labels on bottom
    if (timeLabels && timeLabels.length > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      const labelCount = Math.min(6, timeLabels.length);
      for (let i = 0; i < labelCount; i++) {
        const index = Math.floor((i / (labelCount - 1)) * (timeLabels.length - 1));
        const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
        ctx.fillText(timeLabels[index], x, height - 10);
      }
    }

    // Current price line
    const currentPrice = data[data.length - 1];
    const currentY = padding.top + ((max - currentPrice) / range) * (height - padding.top - padding.bottom);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, currentY);
    ctx.lineTo(width - padding.right, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [data, isUp, timeLabels]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[300px]"
        style={{ display: 'block' }}
      />
    </div>
  );
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

type TimeframeType = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

export default function CompanyDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeType>("1D");
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch company details
        const companyData = await marketService.getCompanyBySymbol(symbol);
        setCompany(companyData);

        // Generate chart data based on timeframe
        generateChartData(toNumber(companyData.current_price), timeframe);

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

  // Generate chart data when timeframe changes
  useEffect(() => {
    if (company) {
      generateChartData(toNumber(company.current_price), timeframe);
    }
  }, [timeframe, company]);

  function generateChartData(basePrice: number, tf: TimeframeType) {
    const data: number[] = [];
    const labels: string[] = [];
    let points = 50;

    // Determine volatility and trend based on company data
    const changePercent = toNumber(company?.price_change_percent);
    const trend = changePercent / 100;

    switch (tf) {
      case "1D":
        points = 78; // Trading hours
        for (let i = 0; i < points; i++) {
          const hour = 9 + Math.floor(i / 10);
          const min = (i % 10) * 6;
          labels.push(`${hour}:${min.toString().padStart(2, '0')}`);
          const noise = (Math.random() - 0.5) * basePrice * 0.01;
          const trendEffect = trend * (i / points) * basePrice;
          data.push(basePrice * 0.995 + noise + trendEffect);
        }
        break;
      case "1W":
        points = 35;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (points - i - 1) / 5);
          labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.02;
          data.push(basePrice * 0.98 + noise + (i / points) * basePrice * 0.04);
        }
        break;
      case "1M":
        points = 22;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (points - i - 1));
          labels.push(date.toLocaleDateString('en', { day: 'numeric', month: 'short' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.03;
          data.push(basePrice * 0.95 + noise + (i / points) * basePrice * 0.08);
        }
        break;
      case "3M":
        points = 65;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (points - i - 1));
          labels.push(date.toLocaleDateString('en', { day: 'numeric', month: 'short' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.04;
          data.push(basePrice * 0.92 + noise + (i / points) * basePrice * 0.12);
        }
        break;
      case "6M":
        points = 130;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (points - i - 1));
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.05;
          data.push(basePrice * 0.88 + noise + (i / points) * basePrice * 0.18);
        }
        break;
      case "YTD":
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((Date.now() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        points = daysSinceStart;
        for (let i = 0; i < points; i++) {
          const date = new Date(startOfYear);
          date.setDate(date.getDate() + i);
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.04;
          data.push(basePrice * 0.9 + noise + (i / points) * basePrice * 0.15);
        }
        break;
      case "1Y":
        points = 252;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (points - i - 1));
          labels.push(date.toLocaleDateString('en', { month: 'short', year: '2-digit' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.06;
          data.push(basePrice * 0.8 + noise + (i / points) * basePrice * 0.25);
        }
        break;
      case "5Y":
        points = 260;
        for (let i = 0; i < points; i++) {
          const date = new Date();
          date.setFullYear(date.getFullYear() - 5 + (i / 52));
          labels.push(date.toLocaleDateString('en', { year: 'numeric' }));
          const noise = (Math.random() - 0.5) * basePrice * 0.1;
          data.push(basePrice * 0.5 + noise + (i / points) * basePrice * 0.6);
        }
        break;
    }

    // Ensure last point is current price
    if (data.length > 0) {
      data[data.length - 1] = basePrice;
    }

    setChartData(data);
    setTimeLabels(labels);
  }

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
  const currency = company.exchange?.code === "ZSE" ? "$" : "R";

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
              <span>{currency === "R" ? "ZAR" : "USD"}</span>
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWatched(!isWatched)}
                className={cn(
                  "p-2 border rounded-md transition-colors",
                  isWatched
                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                    : "border-terminal-border hover:bg-terminal-bg-elevated"
                )}
                title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                <Star className={cn("h-5 w-5", isWatched && "fill-current")} />
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Chart & News */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart Section */}
            <section className="p-4 rounded-lg bg-terminal-bg-secondary border border-terminal-border">
              {/* Timeframe Tabs */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 bg-terminal-bg rounded-lg p-1">
                  {(["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y"] as TimeframeType[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        timeframe === tf
                          ? "bg-brand-orange text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-terminal-bg-elevated"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeframe === "1D" ? "Today" :
                   timeframe === "1W" ? "Past Week" :
                   timeframe === "1M" ? "Past Month" :
                   timeframe === "YTD" ? "Year to Date" :
                   `Past ${timeframe.replace("Y", " Year").replace("M", " Months")}`}
                </div>
              </div>

              {/* Chart */}
              <div className="relative">
                {chartData.length > 0 ? (
                  <StockChart data={chartData} isUp={isUp} timeLabels={timeLabels} currency={currency} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-terminal-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Open</div>
                  <div className="font-mono">{currency}{formatPrice(dayOpen)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Prev. Close</div>
                  <div className="font-mono">{currency}{formatPrice(prevClose)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Day Range</div>
                  <div className="font-mono text-sm">{currency}{formatPrice(dayLow)} - {currency}{formatPrice(dayHigh)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">52 Week Range</div>
                  <div className="font-mono text-sm">{currency}{formatPrice(week52Low)} - {currency}{formatPrice(week52High)}</div>
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
                  <span>{currency === "R" ? "ZAR" : "USD"}</span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
