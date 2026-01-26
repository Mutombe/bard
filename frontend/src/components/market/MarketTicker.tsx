"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { fetchTickerTape } from "@/store/slices/marketSlice";
import { cn, formatPrice, formatPercent } from "@/lib/utils";
import type { TickerData } from "@/types";

interface TickerItemProps {
  data: TickerData;
  onClick?: (symbol: string) => void;
}

function TickerItem({ data, onClick }: TickerItemProps) {
  const { symbol, price, change, change_percent, is_up } = data;

  const colorClass = is_up
    ? "text-market-up"
    : change < 0
      ? "text-market-down"
      : "text-muted-foreground";

  const bgClass = is_up
    ? "hover:bg-market-up-bg"
    : change < 0
      ? "hover:bg-market-down-bg"
      : "hover:bg-terminal-bg-elevated";

  const Icon = is_up ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <button
      onClick={() => onClick?.(symbol)}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded transition-colors",
        "cursor-pointer select-none",
        bgClass
      )}
    >
      {/* Symbol */}
      <span className="font-mono font-semibold text-foreground">{symbol}</span>

      {/* Price */}
      <span className={cn("font-mono tabular-nums", colorClass)}>
        {formatPrice(price)}
      </span>

      {/* Change */}
      <div className={cn("flex items-center gap-1", colorClass)}>
        <Icon className="h-3 w-3" />
        <span className="font-mono tabular-nums text-sm">
          {formatPercent(change_percent)}
        </span>
      </div>
    </button>
  );
}

interface MarketTickerProps {
  onSymbolClick?: (symbol: string) => void;
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
  className?: string;
}

export function MarketTicker({
  onSymbolClick,
  speed = 50,
  pauseOnHover = true,
  className,
}: MarketTickerProps) {
  const dispatch = useAppDispatch();
  const { tickerTape, tickerTapeLoading } = useAppSelector(
    (state) => state.market
  );
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch ticker data on mount
  useEffect(() => {
    dispatch(fetchTickerTape());

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchTickerTape());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Start animation when content is ready
  useEffect(() => {
    if (!contentRef.current || tickerTape.length === 0) return;

    const contentWidth = contentRef.current.scrollWidth / 2;
    const duration = contentWidth / speed;

    controls.start({
      x: -contentWidth,
      transition: {
        duration,
        ease: "linear",
        repeat: Infinity,
      },
    });
  }, [tickerTape, speed, controls]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      controls.stop();
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && contentRef.current) {
      const contentWidth = contentRef.current.scrollWidth / 2;
      const duration = contentWidth / speed;

      controls.start({
        x: -contentWidth,
        transition: {
          duration,
          ease: "linear",
          repeat: Infinity,
        },
      });
    }
  };

  if (tickerTapeLoading && tickerTape.length === 0) {
    return (
      <div
        className={cn(
          "h-12 bg-terminal-bg-secondary border-b border-terminal-border",
          "flex items-center justify-center",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-sm">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (tickerTape.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedTickers = [...tickerTape, ...tickerTape];

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-12 bg-terminal-bg-secondary border-b border-terminal-border",
        "overflow-hidden relative",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-terminal-bg-secondary to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-terminal-bg-secondary to-transparent z-10 pointer-events-none" />

      {/* Live indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-market-up animate-pulse" />
        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
          LIVE
        </span>
      </div>

      {/* Scrolling ticker */}
      <motion.div
        ref={contentRef}
        animate={controls}
        className="flex items-center h-full pl-20"
        style={{ width: "max-content" }}
      >
        {duplicatedTickers.map((ticker, index) => (
          <TickerItem
            key={`${ticker.symbol}-${index}`}
            data={ticker}
            onClick={onSymbolClick}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Alternative static ticker (non-scrolling, for mobile or preference)
export function MarketTickerStatic({
  onSymbolClick,
  className,
}: {
  onSymbolClick?: (symbol: string) => void;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const { tickerTape, tickerTapeLoading } = useAppSelector(
    (state) => state.market
  );

  useEffect(() => {
    dispatch(fetchTickerTape());
  }, [dispatch]);

  if (tickerTapeLoading && tickerTape.length === 0) {
    return (
      <div
        className={cn(
          "h-12 bg-terminal-bg-secondary border-b border-terminal-border",
          "flex items-center px-4",
          className
        )}
      >
        <div className="flex gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 w-24 bg-terminal-border rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-12 bg-terminal-bg-secondary border-b border-terminal-border",
        "overflow-x-auto scrollbar-hide",
        className
      )}
    >
      <div className="flex items-center h-full px-4 gap-1">
        {/* Live indicator */}
        <div className="flex items-center gap-2 pr-4 border-r border-terminal-border">
          <div className="h-2 w-2 rounded-full bg-market-up animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">LIVE</span>
        </div>

        {tickerTape.map((ticker) => (
          <TickerItem
            key={ticker.symbol}
            data={ticker}
            onClick={onSymbolClick}
          />
        ))}
      </div>
    </div>
  );
}
