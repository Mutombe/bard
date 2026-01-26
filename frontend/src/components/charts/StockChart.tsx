"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CandlestickChart,
  LineChart,
  Maximize2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChartType = "line" | "candlestick" | "area" | "bar";
type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "ALL";

interface OHLCData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  data: OHLCData[];
  className?: string;
  showToolbar?: boolean;
  showVolume?: boolean;
  height?: number;
  defaultChartType?: ChartType;
  defaultTimeFrame?: TimeFrame;
  onTimeFrameChange?: (timeFrame: TimeFrame) => void;
}

const timeFrames: TimeFrame[] = ["1D", "1W", "1M", "3M", "1Y", "5Y", "ALL"];

export function StockChart({
  symbol,
  data,
  className,
  showToolbar = true,
  showVolume = true,
  height = 400,
  defaultChartType = "candlestick",
  defaultTimeFrame = "1M",
  onTimeFrameChange,
}: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(defaultTimeFrame);
  const [hoveredData, setHoveredData] = useState<OHLCData | null>(null);

  // Calculate price stats
  const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const firstPrice = data.length > 0 ? data[0].open : 0;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Calculate chart bounds
  const minPrice = Math.min(...data.map((d) => d.low));
  const maxPrice = Math.max(...data.map((d) => d.high));
  const priceRange = maxPrice - minPrice;
  const maxVolume = Math.max(...data.map((d) => d.volume));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = showVolume ? height * 0.75 : height;
    const volumeHeight = showVolume ? height * 0.2 : 0;
    const volumeTop = chartHeight + 10;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart styling
    const gridColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim();
    const upColor = "#10B981";
    const downColor = "#EF4444";
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim();

    // Draw grid
    ctx.strokeStyle = `hsl(${gridColor})`;
    ctx.lineWidth = 0.5;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = `hsl(${textColor})`;
      ctx.font = "10px monospace";
      ctx.fillText(price.toFixed(2), 5, y - 2);
    }

    // Bar/candle width
    const barWidth = Math.max(1, (width / data.length) * 0.8);
    const barGap = (width / data.length) * 0.2;

    // Draw chart based on type
    data.forEach((d, i) => {
      const x = (width / data.length) * i + barGap / 2;
      const isUp = d.close >= d.open;

      if (chartType === "candlestick") {
        // Draw wick
        const wickX = x + barWidth / 2;
        const highY = ((maxPrice - d.high) / priceRange) * chartHeight;
        const lowY = ((maxPrice - d.low) / priceRange) * chartHeight;

        ctx.strokeStyle = isUp ? upColor : downColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wickX, highY);
        ctx.lineTo(wickX, lowY);
        ctx.stroke();

        // Draw body
        const openY = ((maxPrice - d.open) / priceRange) * chartHeight;
        const closeY = ((maxPrice - d.close) / priceRange) * chartHeight;
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(closeY - openY));

        ctx.fillStyle = isUp ? upColor : downColor;
        ctx.fillRect(x, bodyTop, barWidth, bodyHeight);
      } else if (chartType === "bar") {
        const highY = ((maxPrice - d.high) / priceRange) * chartHeight;
        const lowY = ((maxPrice - d.low) / priceRange) * chartHeight;
        const openY = ((maxPrice - d.open) / priceRange) * chartHeight;
        const closeY = ((maxPrice - d.close) / priceRange) * chartHeight;

        ctx.strokeStyle = isUp ? upColor : downColor;
        ctx.lineWidth = 1;

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, highY);
        ctx.lineTo(x + barWidth / 2, lowY);
        ctx.stroke();

        // Open tick (left)
        ctx.beginPath();
        ctx.moveTo(x, openY);
        ctx.lineTo(x + barWidth / 2, openY);
        ctx.stroke();

        // Close tick (right)
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, closeY);
        ctx.lineTo(x + barWidth, closeY);
        ctx.stroke();
      } else if (chartType === "line" || chartType === "area") {
        const y = ((maxPrice - d.close) / priceRange) * chartHeight;

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x + barWidth / 2, y);
        } else {
          ctx.lineTo(x + barWidth / 2, y);
        }
      }

      // Draw volume bars
      if (showVolume && maxVolume > 0) {
        const volumeBarHeight = (d.volume / maxVolume) * volumeHeight;
        ctx.fillStyle = isUp ? `${upColor}60` : `${downColor}60`;
        ctx.fillRect(x, volumeTop + volumeHeight - volumeBarHeight, barWidth, volumeBarHeight);
      }
    });

    // Complete line/area chart
    if (chartType === "line" || chartType === "area") {
      ctx.strokeStyle = isPositive ? upColor : downColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (chartType === "area") {
        const lastX = (width / data.length) * (data.length - 1) + barGap / 2 + barWidth / 2;
        ctx.lineTo(lastX, chartHeight);
        ctx.lineTo(barGap / 2 + barWidth / 2, chartHeight);
        ctx.closePath();
        ctx.fillStyle = isPositive ? `${upColor}20` : `${downColor}20`;
        ctx.fill();
      }
    }
  }, [data, chartType, showVolume, height, isPositive, maxPrice, minPrice, priceRange, maxVolume]);

  const handleTimeFrameChange = (tf: TimeFrame) => {
    setTimeFrame(tf);
    onTimeFrameChange?.(tf);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold font-mono">{symbol}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums">
              {latestPrice.toFixed(2)}
            </span>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-1 text-sm font-mono",
                isPositive ? "text-up" : "text-down"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </motion.div>
          </div>
        </div>

        {showToolbar && (
          <div className="flex items-center gap-2">
            {/* Chart type selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {chartType === "candlestick" && <CandlestickChart className="h-4 w-4" />}
                  {chartType === "line" && <LineChart className="h-4 w-4" />}
                  {chartType === "area" && <TrendingUp className="h-4 w-4" />}
                  {chartType === "bar" && <BarChart3 className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setChartType("candlestick")}>
                  <CandlestickChart className="h-4 w-4 mr-2" />
                  Candlestick
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("line")}>
                  <LineChart className="h-4 w-4 mr-2" />
                  Line
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("area")}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Area
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("bar")}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  OHLC Bar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Time frame selector */}
      {showToolbar && (
        <div className="flex items-center gap-1 mb-4">
          {timeFrames.map((tf) => (
            <Button
              key={tf}
              variant={timeFrame === tf ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs font-mono"
              onClick={() => handleTimeFrameChange(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      )}

      {/* Chart canvas */}
      <div
        ref={containerRef}
        className="relative w-full card-terminal overflow-hidden"
        style={{ height }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Hover overlay */}
        {hoveredData && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-md p-2 text-xs font-mono">
            <div>O: {hoveredData.open.toFixed(2)}</div>
            <div>H: {hoveredData.high.toFixed(2)}</div>
            <div>L: {hoveredData.low.toFixed(2)}</div>
            <div>C: {hoveredData.close.toFixed(2)}</div>
            <div>V: {(hoveredData.volume / 1000000).toFixed(2)}M</div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini sparkline chart for use in tables and cards.
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: "up" | "down" | "neutral";
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "neutral",
  className,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const colors = {
      up: "#10B981",
      down: "#EF4444",
      neutral: "#6B7280",
    };

    ctx.strokeStyle = colors[color];
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    data.forEach((value, i) => {
      const x = (width / (data.length - 1)) * i;
      const y = height - ((value - min) / range) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [data, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height }}
    />
  );
}
