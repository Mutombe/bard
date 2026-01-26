"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Globe,
} from "lucide-react";
import { Sparkline } from "./StockChart";

interface MarketIndex {
  code: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

interface MarketOverviewProps {
  indices: MarketIndex[];
  className?: string;
}

export function MarketOverview({ indices, className }: MarketOverviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Market Overview</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Live
          <motion.span
            className="inline-block ml-1 h-2 w-2 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </span>
      </div>

      {/* Index Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indices.map((index) => {
          const isPositive = index.change >= 0;
          const isSelected = selectedIndex === index.code;

          return (
            <motion.div
              key={index.code}
              className={cn(
                "card-terminal p-4 cursor-pointer transition-all duration-200",
                isSelected && "ring-1 ring-primary"
              )}
              onClick={() => setSelectedIndex(isSelected ? null : index.code)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {index.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {index.code}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                    isPositive ? "badge-up" : "badge-down"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums">
                    {index.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-mono tabular-nums",
                      isPositive ? "text-up" : "text-down"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {index.change.toFixed(2)}
                  </div>
                </div>
                <Sparkline
                  data={index.sparklineData}
                  width={80}
                  height={32}
                  color={isPositive ? "up" : "down"}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Market Status */}
      <div className="flex items-center justify-between px-4 py-2 card-terminal">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Market Status:
            </span>
            <span className="text-sm font-medium text-green-500">Open</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Closes in 2h 34m
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            <span>Volume: 2.4B</span>
          </div>
          <div>Advances: 142 | Declines: 87</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Top movers component showing gainers and losers.
 */
interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TopMoversProps {
  gainers: Mover[];
  losers: Mover[];
  className?: string;
}

export function TopMovers({ gainers, losers, className }: TopMoversProps) {
  const [view, setView] = useState<"gainers" | "losers">("gainers");
  const movers = view === "gainers" ? gainers : losers;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with tabs */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            view === "gainers"
              ? "bg-green-500/20 text-green-500"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setView("gainers")}
        >
          <TrendingUp className="h-4 w-4" />
          Top Gainers
        </button>
        <button
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            view === "losers"
              ? "bg-red-500/20 text-red-500"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setView("losers")}
        >
          <TrendingDown className="h-4 w-4" />
          Top Losers
        </button>
      </div>

      {/* Movers list */}
      <div className="space-y-2">
        {movers.map((mover, i) => {
          const isPositive = mover.change >= 0;

          return (
            <motion.div
              key={mover.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 card-terminal hover:bg-terminal-elevated cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono w-4">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium font-mono">{mover.symbol}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {mover.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono tabular-nums">
                  {mover.price.toFixed(2)}
                </div>
                <div
                  className={cn(
                    "text-xs font-mono tabular-nums",
                    isPositive ? "text-up" : "text-down"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {mover.changePercent.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
