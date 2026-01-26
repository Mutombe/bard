"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TechnicalIndicator {
  name: string;
  shortName: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  description: string;
}

interface TechnicalSummary {
  overallSignal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  buyCount: number;
  sellCount: number;
  neutralCount: number;
}

interface TechnicalIndicatorsProps {
  symbol: string;
  price: number;
  indicators: {
    moving_averages: TechnicalIndicator[];
    oscillators: TechnicalIndicator[];
  };
  summary: TechnicalSummary;
  className?: string;
}

export function TechnicalIndicators({
  symbol,
  price,
  indicators,
  summary,
  className,
}: TechnicalIndicatorsProps) {
  const [expandedSection, setExpandedSection] = useState<"ma" | "osc" | null>("ma");

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "strong_buy":
      case "buy":
        return "text-up";
      case "strong_sell":
      case "sell":
        return "text-down";
      default:
        return "text-muted-foreground";
    }
  };

  const getSignalBg = (signal: string) => {
    switch (signal) {
      case "strong_buy":
      case "buy":
        return "bg-green-500/20";
      case "strong_sell":
      case "sell":
        return "bg-red-500/20";
      default:
        return "bg-muted/50";
    }
  };

  const getSignalLabel = (signal: string) => {
    switch (signal) {
      case "strong_buy":
        return "Strong Buy";
      case "buy":
        return "Buy";
      case "strong_sell":
        return "Strong Sell";
      case "sell":
        return "Sell";
      default:
        return "Neutral";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Technical Analysis</h3>
          <span className="text-sm text-muted-foreground font-mono">{symbol}</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Price</div>
          <div className="font-mono font-bold tabular-nums">
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Summary Gauge */}
      <div className="card-terminal p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Overall Signal</span>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              getSignalBg(summary.overallSignal),
              getSignalColor(summary.overallSignal)
            )}
          >
            {getSignalLabel(summary.overallSignal)}
          </motion.div>
        </div>

        {/* Signal Gauge */}
        <div className="relative h-8 bg-terminal-elevated rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-red-500/30" />
            <div className="flex-1 bg-red-500/20" />
            <div className="flex-1 bg-muted/30" />
            <div className="flex-1 bg-green-500/20" />
            <div className="flex-1 bg-green-500/30" />
          </div>
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-primary"
            initial={{ left: "50%" }}
            animate={{
              left: `${getGaugePosition(summary.overallSignal)}%`,
            }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-mono text-muted-foreground">
            <span>Strong Sell</span>
            <span>Sell</span>
            <span>Neutral</span>
            <span>Buy</span>
            <span>Strong Buy</span>
          </div>
        </div>

        {/* Signal Counts */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-up">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xl font-bold">{summary.buyCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Buy</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xl font-bold">{summary.neutralCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Neutral</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-down">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xl font-bold">{summary.sellCount}</span>
            </div>
            <div className="text-xs text-muted-foreground">Sell</div>
          </div>
        </div>
      </div>

      {/* Moving Averages Section */}
      <div className="card-terminal overflow-hidden">
        <button
          className="flex items-center justify-between w-full p-4 hover:bg-terminal-elevated transition-colors"
          onClick={() => setExpandedSection(expandedSection === "ma" ? null : "ma")}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Moving Averages</span>
            <span className="text-xs text-muted-foreground">
              ({indicators.moving_averages.length} indicators)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expandedSection === "ma" && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {expandedSection === "ma" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {indicators.moving_averages.map((indicator) => (
                  <IndicatorRow key={indicator.name} indicator={indicator} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Oscillators Section */}
      <div className="card-terminal overflow-hidden">
        <button
          className="flex items-center justify-between w-full p-4 hover:bg-terminal-elevated transition-colors"
          onClick={() => setExpandedSection(expandedSection === "osc" ? null : "osc")}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Oscillators</span>
            <span className="text-xs text-muted-foreground">
              ({indicators.oscillators.length} indicators)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expandedSection === "osc" && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {expandedSection === "osc" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {indicators.oscillators.map((indicator) => (
                  <IndicatorRow key={indicator.name} indicator={indicator} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IndicatorRow({ indicator }: { indicator: TechnicalIndicator }) {
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "buy":
        return <CheckCircle className="h-4 w-4 text-up" />;
      case "sell":
        return <XCircle className="h-4 w-4 text-down" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-terminal-elevated/50 rounded-lg">
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-2">
                <span className="text-sm font-medium">{indicator.shortName}</span>
                <Info className="h-3 w-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium">{indicator.name}</p>
              <p className="text-xs text-muted-foreground">{indicator.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono tabular-nums text-sm">
          {indicator.value.toFixed(2)}
        </span>
        <div className="flex items-center gap-1 w-20 justify-end">
          {getSignalIcon(indicator.signal)}
          <span
            className={cn(
              "text-xs font-medium capitalize",
              indicator.signal === "buy"
                ? "text-up"
                : indicator.signal === "sell"
                ? "text-down"
                : "text-muted-foreground"
            )}
          >
            {indicator.signal}
          </span>
        </div>
      </div>
    </div>
  );
}

function getGaugePosition(signal: string): number {
  switch (signal) {
    case "strong_sell":
      return 10;
    case "sell":
      return 30;
    case "neutral":
      return 50;
    case "buy":
      return 70;
    case "strong_buy":
      return 90;
    default:
      return 50;
  }
}

/**
 * Pivot Points component showing support and resistance levels.
 */
interface PivotLevel {
  name: string;
  value: number;
  type: "support" | "resistance" | "pivot";
}

interface PivotPointsProps {
  currentPrice: number;
  pivots: PivotLevel[];
  className?: string;
}

export function PivotPoints({ currentPrice, pivots, className }: PivotPointsProps) {
  const sortedPivots = [...pivots].sort((a, b) => b.value - a.value);
  const minValue = Math.min(...pivots.map((p) => p.value));
  const maxValue = Math.max(...pivots.map((p) => p.value));
  const range = maxValue - minValue;

  const pricePosition = ((maxValue - currentPrice) / range) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Pivot Points</span>
        <span className="text-xs text-muted-foreground">Classic</span>
      </div>

      <div className="relative">
        {/* Price line */}
        <div className="absolute left-0 right-0 h-px bg-primary z-10" style={{ top: `${pricePosition}%` }}>
          <div className="absolute right-0 -translate-y-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-mono">
            ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Pivot levels */}
        <div className="space-y-3">
          {sortedPivots.map((pivot) => (
            <div
              key={pivot.name}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                pivot.type === "resistance"
                  ? "bg-red-500/10"
                  : pivot.type === "support"
                  ? "bg-green-500/10"
                  : "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    pivot.type === "resistance"
                      ? "bg-red-500"
                      : pivot.type === "support"
                      ? "bg-green-500"
                      : "bg-primary"
                  )}
                />
                <span className="text-sm font-medium">{pivot.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-sm">
                  ${pivot.value.toFixed(2)}
                </span>
                <span
                  className={cn(
                    "text-xs font-mono",
                    pivot.value > currentPrice ? "text-down" : "text-up"
                  )}
                >
                  {pivot.value > currentPrice ? "+" : ""}
                  {((pivot.value - currentPrice) / currentPrice * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Key Statistics component.
 */
interface KeyStat {
  label: string;
  value: string | number;
  change?: number;
  tooltip?: string;
}

interface KeyStatisticsProps {
  stats: KeyStat[];
  className?: string;
}

export function KeyStatistics({ stats, className }: KeyStatisticsProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="card-terminal p-3">
          <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-medium tabular-nums">
              {typeof stat.value === "number"
                ? stat.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : stat.value}
            </span>
            {stat.change !== undefined && (
              <span
                className={cn(
                  "text-xs font-mono",
                  stat.change >= 0 ? "text-up" : "text-down"
                )}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
