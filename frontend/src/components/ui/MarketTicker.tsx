"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Pause, Play } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketTickerProps {
  items: TickerItem[];
  speed?: number;
  className?: string;
}

export function MarketTicker({
  items,
  speed = 50,
  className,
}: MarketTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const firstChild = containerRef.current.firstElementChild as HTMLElement;
      if (firstChild) {
        setContentWidth(firstChild.offsetWidth);
      }
    }
  }, [items]);

  useAnimationFrame((time, delta) => {
    if (isPaused || contentWidth === 0) return;

    setPosition((prev) => {
      const newPosition = prev - (speed * delta) / 1000;
      if (newPosition < -contentWidth) {
        return 0;
      }
      return newPosition;
    });
  });

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-terminal border-y border-border",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <Pause className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-terminal to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-terminal to-transparent z-10" />

      {/* Ticker content */}
      <div
        ref={containerRef}
        className="flex py-2"
        style={{ transform: `translateX(${position}px)` }}
      >
        {duplicatedItems.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <div
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-3 px-4 whitespace-nowrap border-r border-border last:border-r-0"
            >
              <span className="font-mono font-medium text-sm">{item.symbol}</span>
              <span className="font-mono text-sm tabular-nums">
                {item.price.toFixed(2)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-mono tabular-nums",
                  isPositive ? "text-up" : "text-down"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {item.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact ticker for embedding in headers or footers.
 */
interface CompactTickerProps {
  items: TickerItem[];
  className?: string;
}

export function CompactTicker({ items, className }: CompactTickerProps) {
  return (
    <div className={cn("flex items-center gap-4 overflow-x-auto", className)}>
      {items.map((item) => {
        const isPositive = item.change >= 0;
        return (
          <div
            key={item.symbol}
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-xs font-medium">{item.symbol}</span>
            <span
              className={cn(
                "text-xs font-mono tabular-nums",
                isPositive ? "text-up" : "text-down"
              )}
            >
              {isPositive ? "+" : ""}
              {item.changePercent.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Breaking news alert banner.
 */
interface BreakingNewsAlertProps {
  headline: string;
  timestamp: string;
  onDismiss?: () => void;
  onClick?: () => void;
  className?: string;
}

export function BreakingNewsAlert({
  headline,
  timestamp,
  onDismiss,
  onClick,
  className,
}: BreakingNewsAlertProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={cn(
        "bg-red-500 text-white overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <motion.span
            className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold uppercase tracking-wider"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Breaking
          </motion.span>
          <button
            onClick={onClick}
            className="text-sm font-medium hover:underline text-left"
          >
            {headline}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/70">{timestamp}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-white/70 hover:text-white text-sm"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Market status indicator.
 */
interface MarketStatusProps {
  exchange: string;
  status: "open" | "closed" | "pre-market" | "after-hours";
  nextEvent?: string;
  className?: string;
}

export function MarketStatus({
  exchange,
  status,
  nextEvent,
  className,
}: MarketStatusProps) {
  const statusConfig = {
    open: { label: "Open", color: "bg-green-500" },
    closed: { label: "Closed", color: "bg-red-500" },
    "pre-market": { label: "Pre-Market", color: "bg-amber-500" },
    "after-hours": { label: "After Hours", color: "bg-purple-500" },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">{exchange}</span>
      <div className="flex items-center gap-1.5">
        <motion.div
          className={cn("h-2 w-2 rounded-full", config.color)}
          animate={status === "open" ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      {nextEvent && (
        <span className="text-xs text-muted-foreground">{nextEvent}</span>
      )}
    </div>
  );
}

/**
 * Live price display with animation.
 */
interface LivePriceProps {
  price: number;
  previousPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LivePrice({
  price,
  previousPrice,
  currency = "$",
  size = "md",
  className,
}: LivePriceProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (previousPrice !== undefined && previousPrice !== price) {
      setFlash(price > previousPrice ? "up" : "down");
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [price, previousPrice]);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <motion.span
      className={cn(
        "font-mono font-bold tabular-nums",
        sizeClasses[size],
        flash === "up" && "text-up",
        flash === "down" && "text-down",
        className
      )}
      animate={flash ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      {currency}
      {price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </motion.span>
  );
}

/**
 * Price change badge.
 */
interface PriceChangeBadgeProps {
  change: number;
  changePercent: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceChangeBadge({
  change,
  changePercent,
  showIcon = true,
  size = "md",
  className,
}: PriceChangeBadgeProps) {
  const isPositive = change >= 0;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-mono tabular-nums font-medium",
        isPositive ? "badge-up" : "badge-down",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        isPositive ? (
          <TrendingUp className={iconSizes[size]} />
        ) : (
          <TrendingDown className={iconSizes[size]} />
        )
      )}
      {isPositive ? "+" : ""}
      {change.toFixed(2)} ({changePercent.toFixed(2)}%)
    </span>
  );
}
