"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Globe,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { marketService } from "@/services/api/market";
import type { MarketIndex } from "@/types";

// Skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-terminal-bg-elevated rounded", className)} />
  );
}

function IndexChart({ data, isUp }: { data: number[]; isUp: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const minValue = Math.min(...data) * 0.998;
    const maxValue = Math.max(...data) * 1.002;
    const range = maxValue - minValue;

    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);
    const getY = (value: number) => height - padding - ((value - minValue) / range) * (height - padding * 2);

    // Draw grid
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - padding * 2);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      const value = maxValue - (i / 4) * range;
      ctx.fillStyle = "#666";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(value.toFixed(0), padding - 5, y + 4);
    }

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    if (isUp) {
      gradient.addColorStop(0, "rgba(0, 215, 117, 0.3)");
      gradient.addColorStop(1, "rgba(0, 215, 117, 0)");
    } else {
      gradient.addColorStop(0, "rgba(255, 59, 59, 0.3)");
      gradient.addColorStop(1, "rgba(255, 59, 59, 0)");
    }

    ctx.beginPath();
    ctx.moveTo(getX(0), height - padding);
    data.forEach((value, index) => {
      ctx.lineTo(getX(index), getY(value));
    });
    ctx.lineTo(getX(data.length - 1), height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    data.forEach((value, index) => {
      ctx.lineTo(getX(index), getY(value));
    });
    ctx.strokeStyle = isUp ? "#00D775" : "#FF3B3B";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current value dot
    const lastX = getX(data.length - 1);
    const lastY = getY(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isUp ? "#00D775" : "#FF3B3B";
    ctx.fill();
  }, [data, isUp]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={300}
      className="w-full h-auto"
    />
  );
}

// Loading skeleton for the index page
function IndexPageSkeleton() {
  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[450px] rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-52 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function IndexDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [timeframe, setTimeframe] = useState("1D");
  const [indexData, setIndexData] = useState<MarketIndex | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [relatedIndices, setRelatedIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch index data
        const data = await marketService.getIndex(symbol);
        setIndexData(data);

        // Generate chart data based on current value
        const baseValue = parseFloat(String(data.current_value || data.value || 50000));
        const dataChange = parseFloat(String(data.change || 0));
        const chartPoints: number[] = [];
        for (let i = 0; i < 20; i++) {
          const randomChange = (Math.random() - 0.5) * baseValue * 0.02;
          const trendFactor = dataChange >= 0 ? 0.001 * i : -0.001 * i;
          chartPoints.push(baseValue * (0.99 + trendFactor) + randomChange);
        }
        chartPoints.push(baseValue); // End at current value
        setChartData(chartPoints);

        // Fetch related indices
        try {
          const allIndices = await marketService.getIndices();
          setRelatedIndices(allIndices.filter(idx => idx.code !== symbol).slice(0, 3));
        } catch {
          setRelatedIndices([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch index:", err);
        setError(err.message || "Index not found");
      } finally {
        setIsLoading(false);
      }
    }

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  if (isLoading) {
    return <IndexPageSkeleton />;
  }

  if (error || !indexData) {
    return (
      <MainLayout>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-market-down mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Index Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The index &quot;{symbol.toUpperCase()}&quot; was not found in our database.
          </p>
          <Link href="/markets" className="text-brand-orange hover:underline">
            Back to Markets
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Parse values as numbers (API returns decimals as strings)
  const change = parseFloat(String(indexData.change || 0));
  const changePercent = parseFloat(String(indexData.change_percent || 0));
  const value = parseFloat(String(indexData.current_value || indexData.value || 0));
  const isUp = change >= 0;

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/markets" className="hover:text-foreground">Markets</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/markets" className="hover:text-foreground">Indices</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{indexData.code}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                      {indexData.exchange?.code || "INDEX"}
                    </span>
                    {indexData.country && (
                      <span className="px-2 py-0.5 text-xs bg-terminal-bg-elevated text-muted-foreground rounded">
                        {indexData.country}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold">{indexData.name}</h1>
                  <p className="text-muted-foreground">{indexData.code}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold">
                    {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className={cn(
                    "flex items-center justify-end gap-1 text-lg",
                    isUp ? "text-market-up" : "text-market-down"
                  )}>
                    {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="font-mono">
                      {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={cn(
                        "px-3 py-1 text-sm rounded transition-colors",
                        timeframe === tf
                          ? "bg-brand-orange text-white"
                          : "bg-terminal-bg-elevated text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                {chartData.length > 0 ? (
                  <IndexChart data={chartData} isUp={isUp} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-terminal-border">
                <div>
                  <div className="text-xs text-muted-foreground">Open</div>
                  <div className="font-mono">{parseFloat(String(indexData.open || value)).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">High</div>
                  <div className="font-mono text-market-up">{parseFloat(String(indexData.day_high || indexData.high || value)).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Low</div>
                  <div className="font-mono text-market-down">{parseFloat(String(indexData.day_low || indexData.low || value)).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Prev Close</div>
                  <div className="font-mono">{parseFloat(String(indexData.previous_close || value)).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Top Constituents */}
            {indexData.constituents && indexData.constituents.length > 0 && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border">
                <div className="p-4 border-b border-terminal-border">
                  <h2 className="font-semibold">Top Constituents</h2>
                </div>
                <div className="divide-y divide-terminal-border">
                  {indexData.constituents.slice(0, 8).map((stock: any) => {
                    const stockUp = (stock.change_percent || 0) >= 0;
                    return (
                      <Link
                        key={stock.symbol}
                        href={`/companies/${stock.symbol?.toLowerCase()}`}
                        className="flex items-center justify-between p-4 hover:bg-terminal-bg-elevated transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 text-right">
                            <span className="text-xs text-muted-foreground">{(stock.weight || 0).toFixed(1)}%</span>
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{(stock.price || 0).toFixed(2)}</div>
                          <div className={cn(
                            "text-sm flex items-center justify-end gap-1",
                            stockUp ? "text-market-up" : "text-market-down"
                          )}>
                            {stockUp ? "+" : ""}{(stock.change_percent || 0).toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* About Index */}
            {indexData.description && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
                <h2 className="font-semibold mb-4">About {indexData.name}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {indexData.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Statistics */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand-orange" />
                Key Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">52 Week High</span>
                  <span className="font-mono text-sm">{parseFloat(String(indexData.year_high || value * 1.1)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">52 Week Low</span>
                  <span className="font-mono text-sm">{parseFloat(String(indexData.year_low || value * 0.9)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">YTD Change</span>
                  <span className={cn(
                    "font-mono text-sm",
                    parseFloat(String(indexData.ytd_change || 0)) >= 0 ? "text-market-up" : "text-market-down"
                  )}>
                    {parseFloat(String(indexData.ytd_change || 0)) >= 0 ? "+" : ""}{parseFloat(String(indexData.ytd_change || 0)).toFixed(2)}%
                  </span>
                </div>
                {indexData.market_cap && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Market Cap</span>
                    <span className="font-mono text-sm">{indexData.market_cap}</span>
                  </div>
                )}
                {indexData.constituents_count && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Constituents</span>
                    <span className="font-mono text-sm">{indexData.constituents_count}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Index Info */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-orange" />
                Index Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Exchange</span>
                  <span className="text-sm">{indexData.exchange?.code || "N/A"}</span>
                </div>
                {indexData.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Country</span>
                    <span className="text-sm">{indexData.country}</span>
                  </div>
                )}
                {indexData.currency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Currency</span>
                    <span className="text-sm">{indexData.currency}</span>
                  </div>
                )}
                {indexData.trading_hours && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Trading Hours</span>
                    <span className="text-sm">{indexData.trading_hours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Indices */}
            {relatedIndices.length > 0 && (
              <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
                <h3 className="font-semibold mb-4">Related Indices</h3>
                <div className="space-y-2">
                  {relatedIndices.map((idx) => {
                    const idxChangePercent = parseFloat(String(idx.change_percent || 0));
                    const up = idxChangePercent >= 0;
                    return (
                      <Link
                        key={idx.code}
                        href={`/markets/indices/${idx.code}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors"
                      >
                        <div>
                          <div className="font-mono text-sm">{idx.code}</div>
                          <div className="text-xs text-muted-foreground">{idx.exchange_code || ""}</div>
                        </div>
                        <div className={cn(
                          "text-sm font-mono",
                          up ? "text-market-up" : "text-market-down"
                        )}>
                          {up ? "+" : ""}{idxChangePercent.toFixed(2)}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href={`/news?index=${symbol}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <span>Related News</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/research?index=${symbol}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-terminal-bg-elevated transition-colors text-sm"
                >
                  <span>Research Reports</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
