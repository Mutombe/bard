"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Pause, Play } from "lucide-react";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isUp: boolean;
}

// Default ticker data for African markets
const defaultTickerData: TickerItem[] = [
  { symbol: "J203", name: "JSE ALSI", price: 78456.23, change: 234.56, changePercent: 0.30, isUp: true },
  { symbol: "J200", name: "JSE TOP40", price: 71234.56, change: -123.45, changePercent: -0.17, isUp: false },
  { symbol: "NGXASI", name: "NGX ASI", price: 98234.56, change: 456.78, changePercent: 0.47, isUp: true },
  { symbol: "EGX30", name: "EGX 30", price: 28765.43, change: 189.23, changePercent: 0.66, isUp: true },
  { symbol: "NPN", name: "Naspers", price: 3245.67, change: 45.23, changePercent: 1.41, isUp: true },
  { symbol: "MTN", name: "MTN Group", price: 156.78, change: -2.34, changePercent: -1.47, isUp: false },
  { symbol: "SBK", name: "Standard Bank", price: 189.45, change: 3.21, changePercent: 1.72, isUp: true },
  { symbol: "SOL", name: "Sasol", price: 267.89, change: -5.67, changePercent: -2.07, isUp: false },
  { symbol: "AGL", name: "Anglo American", price: 567.34, change: 12.45, changePercent: 2.24, isUp: true },
  { symbol: "DANGCEM", name: "Dangote Cement", price: 289.50, change: 4.50, changePercent: 1.58, isUp: true },
  { symbol: "USD/ZAR", name: "Dollar/Rand", price: 18.2345, change: 0.0234, changePercent: 0.13, isUp: true },
  { symbol: "USD/NGN", name: "Dollar/Naira", price: 1520.45, change: -5.67, changePercent: -0.37, isUp: false },
  { symbol: "GOLD", name: "Gold", price: 2678.90, change: 15.40, changePercent: 0.58, isUp: true },
  { symbol: "BRENT", name: "Brent Crude", price: 82.34, change: -0.89, changePercent: -1.07, isUp: false },
];

function formatPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 100) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function TickerItemComponent({ item }: { item: TickerItem }) {
  return (
    <Link
      href={`/markets/quote/${item.symbol}`}
      className="flex items-center gap-3 px-4 py-1 hover:bg-terminal-bg-elevated/50 transition-colors whitespace-nowrap group"
    >
      <span className="font-mono font-semibold text-foreground group-hover:text-brand-orange transition-colors">
        {item.symbol}
      </span>
      <span className="text-muted-foreground text-sm hidden xl:inline">
        {item.name}
      </span>
      <span className="font-mono tabular-nums">
        {formatPrice(item.price)}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 font-mono text-sm tabular-nums",
          item.isUp ? "text-market-up" : "text-market-down"
        )}
      >
        {item.isUp ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {formatChange(item.change, item.changePercent)}
      </span>
    </Link>
  );
}

export function MarketStrip() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(defaultTickerData);
  const [isPaused, setIsPaused] = useState(false);
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre" | "after">("open");
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const scrollPosition = useRef(0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((item) => {
          const volatility = item.symbol.includes("/") ? 0.0001 : 0.001;
          const randomChange = (Math.random() - 0.5) * 2 * volatility * item.price;
          const newPrice = Math.max(0.01, item.price + randomChange);
          const newChange = item.change + randomChange * 0.1;
          const newPercent = (newChange / (newPrice - newChange)) * 100;

          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newPercent,
            isUp: newChange >= 0,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Smooth scroll animation
  useEffect(() => {
    if (!scrollRef.current || isPaused) return;

    const scrollContainer = scrollRef.current;
    const scrollWidth = scrollContainer.scrollWidth / 2;

    const animate = () => {
      scrollPosition.current += 0.5;
      if (scrollPosition.current >= scrollWidth) {
        scrollPosition.current = 0;
      }
      scrollContainer.scrollLeft = scrollPosition.current;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);

  // Check market hours (simplified - JSE hours)
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const hours = now.getUTCHours() + 2; // SAST is UTC+2
      const day = now.getDay();

      if (day === 0 || day === 6) {
        setMarketStatus("closed");
      } else if (hours >= 9 && hours < 17) {
        setMarketStatus("open");
      } else if (hours >= 7 && hours < 9) {
        setMarketStatus("pre");
      } else if (hours >= 17 && hours < 19) {
        setMarketStatus("after");
      } else {
        setMarketStatus("closed");
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    open: { label: "Markets Open", color: "bg-market-up" },
    closed: { label: "Markets Closed", color: "bg-muted-foreground" },
    pre: { label: "Pre-Market", color: "bg-yellow-500" },
    after: { label: "After Hours", color: "bg-blue-500" },
  };

  return (
    <div className="bg-terminal-bg-secondary border-b border-terminal-border">
      <div className="flex items-center">
        {/* Market Status */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border-r border-terminal-border bg-terminal-bg">
          <span className={cn("h-2 w-2 rounded-full animate-pulse", statusConfig[marketStatus].color)} />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {statusConfig[marketStatus].label}
          </span>
        </div>

        {/* Scrolling Ticker */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex">
            {/* Duplicate items for seamless loop */}
            {[...tickerData, ...tickerData].map((item, index) => (
              <TickerItemComponent key={`${item.symbol}-${index}`} item={item} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 border-l border-terminal-border">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <Link
            href="/markets"
            className="text-xs text-brand-orange hover:text-brand-orange-light transition-colors font-medium"
          >
            Full Market Data
          </Link>
        </div>
      </div>
    </div>
  );
}
