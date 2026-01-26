"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioHolding {
  symbol: string;
  name: string;
  value: number;
  weight: number;
  change: number;
  changePercent: number;
  sector: string;
  color: string;
}

interface PortfolioPerformance {
  date: string;
  value: number;
  dailyReturn: number;
  cumulativeReturn: number;
}

interface PortfolioChartProps {
  holdings: PortfolioHolding[];
  performance: PortfolioPerformance[];
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  className?: string;
}

type ViewMode = "allocation" | "performance" | "sectors";

export function PortfolioChart({
  holdings,
  performance,
  totalValue,
  totalChange,
  totalChangePercent,
  className,
}: PortfolioChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("allocation");
  const [hoveredHolding, setHoveredHolding] = useState<PortfolioHolding | null>(null);
  const isPositive = totalChange >= 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Portfolio Value</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold font-mono tabular-nums">
              ${totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-sm font-mono",
                isPositive ? "badge-up" : "badge-down"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              ${Math.abs(totalChange).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-xs">
                ({isPositive ? "+" : ""}{totalChangePercent.toFixed(2)}%)
              </span>
            </motion.div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-terminal-elevated rounded-lg">
          <Button
            variant={viewMode === "allocation" ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setViewMode("allocation")}
          >
            <PieChart className="h-4 w-4 mr-1" />
            Allocation
          </Button>
          <Button
            variant={viewMode === "performance" ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setViewMode("performance")}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Performance
          </Button>
          <Button
            variant={viewMode === "sectors" ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setViewMode("sectors")}
          >
            <Percent className="h-4 w-4 mr-1" />
            Sectors
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <AnimatePresence mode="wait">
        {viewMode === "allocation" && (
          <motion.div
            key="allocation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
              <DonutChart
                holdings={holdings}
                hoveredHolding={hoveredHolding}
                onHover={setHoveredHolding}
              />
            </div>

            {/* Holdings List */}
            <div className="space-y-2">
              {holdings.map((holding) => (
                <motion.div
                  key={holding.symbol}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                    hoveredHolding?.symbol === holding.symbol
                      ? "bg-terminal-elevated"
                      : "hover:bg-terminal-elevated/50"
                  )}
                  onMouseEnter={() => setHoveredHolding(holding)}
                  onMouseLeave={() => setHoveredHolding(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: holding.color }}
                    />
                    <div>
                      <div className="font-medium font-mono">{holding.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {holding.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular-nums">
                      ${holding.value.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {holding.weight.toFixed(1)}%
                      </span>
                      <span
                        className={cn(
                          "font-mono",
                          holding.change >= 0 ? "text-up" : "text-down"
                        )}
                      >
                        {holding.change >= 0 ? "+" : ""}
                        {holding.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PerformanceChart data={performance} />
          </motion.div>
        )}

        {viewMode === "sectors" && (
          <motion.div
            key="sectors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SectorBreakdown holdings={holdings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Donut chart for portfolio allocation visualization.
 */
interface DonutChartProps {
  holdings: PortfolioHolding[];
  hoveredHolding: PortfolioHolding | null;
  onHover: (holding: PortfolioHolding | null) => void;
}

function DonutChart({ holdings, hoveredHolding, onHover }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 280;
  const center = size / 2;
  const outerRadius = 120;
  const innerRadius = 80;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    let currentAngle = -Math.PI / 2;
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);

    holdings.forEach((holding) => {
      const sliceAngle = (holding.weight / totalWeight) * 2 * Math.PI;
      const isHovered = hoveredHolding?.symbol === holding.symbol;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(
        center,
        center,
        isHovered ? outerRadius + 8 : outerRadius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();

      ctx.fillStyle = holding.color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    ctx.fillStyle = `hsl(${ctx.fillStyle})`;
    ctx.fill();
  }, [holdings, hoveredHolding]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;

    const distance = Math.sqrt(x * x + y * y);
    if (distance < innerRadius || distance > outerRadius + 10) {
      onHover(null);
      return;
    }

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;

    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    let currentAngle = 0;

    for (const holding of holdings) {
      const sliceAngle = (holding.weight / totalWeight) * 2 * Math.PI;
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        onHover(holding);
        return;
      }
      currentAngle += sliceAngle;
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="cursor-pointer"
        style={{ width: size, height: size }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onHover(null)}
      />
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {hoveredHolding ? (
            <motion.div
              key={hoveredHolding.symbol}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="font-mono font-bold text-lg">{hoveredHolding.symbol}</div>
              <div className="text-2xl font-bold font-mono tabular-nums">
                {hoveredHolding.weight.toFixed(1)}%
              </div>
              <div
                className={cn(
                  "text-sm font-mono",
                  hoveredHolding.change >= 0 ? "text-up" : "text-down"
                )}
              >
                {hoveredHolding.change >= 0 ? "+" : ""}
                {hoveredHolding.changePercent.toFixed(2)}%
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="total"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Holdings
              </div>
              <div className="text-2xl font-bold">{holdings.length}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Performance chart showing portfolio value over time.
 */
interface PerformanceChartProps {
  data: PortfolioPerformance[];
}

function PerformanceChart({ data }: PerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const height = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw grid
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = maxValue - (range / 4) * i;
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 5, y + 3);
    }

    ctx.setLineDash([]);

    // Draw area
    const isPositive = data[data.length - 1].value >= data[0].value;
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    const color = isPositive ? "#10B981" : "#EF4444";
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}05`);

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const y = padding.top + ((maxValue - d.value) / range) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * i;
      const y = padding.top + ((maxValue - d.value) / range) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw date labels
    ctx.fillStyle = "hsl(var(--muted-foreground))";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";

    const labelCount = 5;
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((data.length - 1) * (i / (labelCount - 1)));
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const date = new Date(data[index].date);
      ctx.fillText(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        x,
        height - 10
      );
    }
  }, [data]);

  const latestReturn = data.length > 0 ? data[data.length - 1].cumulativeReturn : 0;
  const isPositive = latestReturn >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">30 Day Performance</span>
        </div>
        <div
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
          {isPositive ? "+" : ""}
          {latestReturn.toFixed(2)}%
        </div>
      </div>

      <div ref={containerRef} className="card-terminal overflow-hidden">
        <canvas ref={canvasRef} style={{ width: "100%", height }} />
      </div>
    </div>
  );
}

/**
 * Sector breakdown bar chart.
 */
interface SectorBreakdownProps {
  holdings: PortfolioHolding[];
}

function SectorBreakdown({ holdings }: SectorBreakdownProps) {
  const sectorMap = new Map<string, { value: number; weight: number; change: number }>();

  holdings.forEach((holding) => {
    const existing = sectorMap.get(holding.sector);
    if (existing) {
      existing.value += holding.value;
      existing.weight += holding.weight;
      existing.change = (existing.change + holding.changePercent) / 2;
    } else {
      sectorMap.set(holding.sector, {
        value: holding.value,
        weight: holding.weight,
        change: holding.changePercent,
      });
    }
  });

  const sectors = Array.from(sectorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.weight - a.weight);

  const sectorColors: Record<string, string> = {
    Technology: "#3B82F6",
    Healthcare: "#10B981",
    Finance: "#8B5CF6",
    Energy: "#F59E0B",
    Consumer: "#EC4899",
    Industrial: "#6B7280",
    Materials: "#14B8A6",
    Utilities: "#EAB308",
    "Real Estate": "#F97316",
    Communication: "#06B6D4",
  };

  return (
    <div className="space-y-4">
      {sectors.map((sector) => (
        <div key={sector.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: sectorColors[sector.name] || "#6B7280" }}
              />
              <span className="text-sm font-medium">{sector.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono tabular-nums text-muted-foreground">
                ${(sector.value / 1000).toFixed(1)}k
              </span>
              <span className="font-mono tabular-nums w-16 text-right">
                {sector.weight.toFixed(1)}%
              </span>
              <span
                className={cn(
                  "font-mono tabular-nums w-16 text-right",
                  sector.change >= 0 ? "text-up" : "text-down"
                )}
              >
                {sector.change >= 0 ? "+" : ""}
                {sector.change.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-terminal-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: sectorColors[sector.name] || "#6B7280" }}
              initial={{ width: 0 }}
              animate={{ width: `${sector.weight}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
