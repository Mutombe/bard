"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData, Time, CrosshairMode } from "lightweight-charts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ProfessionalChartProps {
  symbol: string;
  data: ChartDataPoint[];
  currency?: string;
  className?: string;
  height?: number;
  showVolume?: boolean;
  showToolbar?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
}

const TIMEFRAMES = [
  { label: "1D", value: "1D", points: 390 },
  { label: "1W", value: "1W", points: 7 },
  { label: "1M", value: "1M", points: 30 },
  { label: "3M", value: "3M", points: 90 },
  { label: "6M", value: "6M", points: 180 },
  { label: "YTD", value: "YTD", points: 252 },
  { label: "1Y", value: "1Y", points: 252 },
  { label: "5Y", value: "5Y", points: 1260 },
  { label: "ALL", value: "ALL", points: 2520 },
];

const CHART_TYPES = [
  { label: "Candles", value: "candlestick", icon: "📊" },
  { label: "Line", value: "line", icon: "📈" },
  { label: "Area", value: "area", icon: "📉" },
];

export function ProfessionalChart({
  symbol,
  data,
  currency = "R",
  className,
  height = 500,
  showVolume = true,
  showToolbar = true,
  onTimeframeChange,
}: ProfessionalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [activeTimeframe, setActiveTimeframe] = useState("1M");
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  const [crosshairData, setCrosshairData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    change: number;
    changePercent: number;
  } | null>(null);

  // Calculate price change
  const priceChange = data.length >= 2 ? data[data.length - 1].close - data[0].close : 0;
  const priceChangePercent = data.length >= 2 && data[0].close !== 0
    ? ((data[data.length - 1].close - data[0].close) / data[0].close) * 100
    : 0;
  const isPositive = priceChange >= 0;

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height - (showVolume ? 100 : 0),
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.3)" },
        horzLines: { color: "rgba(42, 46, 57, 0.3)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "rgba(224, 227, 235, 0.2)",
          style: 0,
          labelBackgroundColor: "#2962FF",
        },
        horzLine: {
          width: 1,
          color: "rgba(224, 227, 235, 0.2)",
          style: 0,
          labelBackgroundColor: "#2962FF",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.5)",
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.5)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        minBarSpacing: 3,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Create line series (hidden initially)
    const lineSeries = chart.addLineSeries({
      color: isPositive ? "#22c55e" : "#ef4444",
      lineWidth: 2,
      visible: false,
    });
    lineSeriesRef.current = lineSeries;

    // Create area series (hidden initially)
    const areaSeries = chart.addAreaSeries({
      topColor: isPositive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
      bottomColor: isPositive ? "rgba(34, 197, 94, 0.0)" : "rgba(239, 68, 68, 0.0)",
      lineColor: isPositive ? "#22c55e" : "#ef4444",
      lineWidth: 2,
      visible: false,
    });
    areaSeriesRef.current = areaSeries;

    // Create volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairData(null);
        return;
      }

      const candleData = param.seriesData.get(candlestickSeries) as CandlestickData | undefined;
      const volumeData = param.seriesData.get(volumeSeriesRef.current!) as HistogramData | undefined;

      if (candleData && 'open' in candleData) {
        const firstClose = data[0]?.close || candleData.open;
        const change = candleData.close - firstClose;
        const changePercent = firstClose !== 0 ? (change / firstClose) * 100 : 0;

        setCrosshairData({
          time: param.time.toString(),
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volumeData?.value,
          change,
          changePercent,
        });
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [height, showVolume]);

  // Update data when it changes
  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const candlestickData: CandlestickData[] = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const lineData: LineData[] = data.map((d) => ({
      time: d.time,
      value: d.close,
    }));

    const volumeData: HistogramData[] = data.map((d) => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
    }));

    candlestickSeriesRef.current?.setData(candlestickData);
    lineSeriesRef.current?.setData(lineData);
    areaSeriesRef.current?.setData(lineData);
    volumeSeriesRef.current?.setData(volumeData);

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [data]);

  // Update chart type
  useEffect(() => {
    candlestickSeriesRef.current?.applyOptions({ visible: chartType === "candlestick" });
    lineSeriesRef.current?.applyOptions({ visible: chartType === "line" });
    areaSeriesRef.current?.applyOptions({ visible: chartType === "area" });
  }, [chartType]);

  const handleTimeframeChange = useCallback((tf: string) => {
    setActiveTimeframe(tf);
    onTimeframeChange?.(tf);
  }, [onTimeframeChange]);

  const formatPrice = (price: number) => {
    return `${currency}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`;
    if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
    return volume.toString();
  };

  const currentData = crosshairData || (data.length ? {
    time: data[data.length - 1].time.toString(),
    open: data[data.length - 1].open,
    high: data[data.length - 1].high,
    low: data[data.length - 1].low,
    close: data[data.length - 1].close,
    volume: data[data.length - 1].volume,
    change: priceChange,
    changePercent: priceChangePercent,
  } : null);

  return (
    <div className={cn("bg-card rounded-lg border overflow-hidden", className)}>
      {/* Header with OHLC data */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">{symbol}</h3>
            {currentData && (
              <span className={cn(
                "text-lg font-semibold",
                currentData.change >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatPrice(currentData.close)}
                <span className="text-sm ml-2">
                  {currentData.change >= 0 ? "+" : ""}
                  {formatPrice(currentData.change)} ({currentData.changePercent >= 0 ? "+" : ""}{currentData.changePercent.toFixed(2)}%)
                </span>
              </span>
            )}
          </div>
        </div>

        {/* OHLC Values */}
        {currentData && (
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div>
              <span className="text-xs uppercase">Open</span>
              <span className="ml-2 font-mono">{formatPrice(currentData.open)}</span>
            </div>
            <div>
              <span className="text-xs uppercase">High</span>
              <span className="ml-2 font-mono text-green-500">{formatPrice(currentData.high)}</span>
            </div>
            <div>
              <span className="text-xs uppercase">Low</span>
              <span className="ml-2 font-mono text-red-500">{formatPrice(currentData.low)}</span>
            </div>
            <div>
              <span className="text-xs uppercase">Close</span>
              <span className="ml-2 font-mono">{formatPrice(currentData.close)}</span>
            </div>
            {currentData.volume !== undefined && (
              <div>
                <span className="text-xs uppercase">Volume</span>
                <span className="ml-2 font-mono">{formatVolume(currentData.volume)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          {/* Timeframes */}
          <div className="flex gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleTimeframeChange(tf.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeTimeframe === tf.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Types */}
          <div className="flex gap-1">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value as typeof chartType)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                  chartType === type.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={type.label}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        style={{ height: height }}
        className="w-full"
      />

      {/* Footer */}
      <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between">
        <span>Powered by TradingView Charts</span>
        <span>Scroll to zoom, drag to pan</span>
      </div>
    </div>
  );
}

// Helper function to generate realistic chart data
export function generateChartData(
  basePrice: number,
  days: number,
  volatility: number = 0.02,
  trend: number = 0
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dailyVolatility = volatility * (0.5 + Math.random());
    const dailyTrend = trend / days;

    const open = currentPrice;
    const change = currentPrice * dailyVolatility * (Math.random() - 0.5 + dailyTrend);
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility * 0.5);
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    currentPrice = close;

    // Format date as YYYY-MM-DD for TradingView
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      time: dateStr as Time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return data;
}

export default ProfessionalChart;
