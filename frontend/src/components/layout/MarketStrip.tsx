"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Pause, Play, RefreshCw } from "lucide-react";
import { marketService } from "@/services/api/market";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  exchange?: string;
  type?: "stock" | "index" | "currency" | "commodity";
}

// Fallback data for when API fails
const fallbackTickerData: TickerItem[] = [
  { symbol: "J203", name: "JSE ALSI", price: 78456.23, change: 234.56, changePercent: 0.30, isUp: true, type: "index" },
  { symbol: "J200", name: "JSE TOP40", price: 71234.56, change: -123.45, changePercent: -0.17, isUp: false, type: "index" },
  { symbol: "NGXASI", name: "NGX ASI", price: 98234.56, change: 456.78, changePercent: 0.47, isUp: true, type: "index" },
  { symbol: "ZSE", name: "ZSE All Share", price: 145678.90, change: 1234.56, changePercent: 0.85, isUp: true, type: "index" },
  { symbol: "NPN", name: "Naspers", price: 3245.67, change: 45.23, changePercent: 1.41, isUp: true, exchange: "JSE" },
  { symbol: "MTN", name: "MTN Group", price: 156.78, change: -2.34, changePercent: -1.47, isUp: false, exchange: "JSE" },
  { symbol: "ECOH", name: "Econet", price: 45.50, change: 1.25, changePercent: 2.82, isUp: true, exchange: "ZSE" },
  { symbol: "DLTA", name: "Delta Corp", price: 320.00, change: -5.00, changePercent: -1.54, isUp: false, exchange: "ZSE" },
  { symbol: "INNO", name: "Innscor", price: 89.75, change: 2.15, changePercent: 2.46, isUp: true, exchange: "ZSE" },
  { symbol: "CBZ", name: "CBZ Holdings", price: 156.00, change: 3.50, changePercent: 2.29, isUp: true, exchange: "ZSE" },
  { symbol: "USD/ZAR", name: "Dollar/Rand", price: 18.2345, change: 0.0234, changePercent: 0.13, isUp: true, type: "currency" },
  { symbol: "USD/ZIG", name: "Dollar/ZiG", price: 25.5, change: -0.15, changePercent: -0.58, isUp: false, type: "currency" },
  { symbol: "GOLD", name: "Gold", price: 2678.90, change: 15.40, changePercent: 0.58, isUp: true, type: "commodity" },
  { symbol: "BRENT", name: "Brent Crude", price: 82.34, change: -0.89, changePercent: -1.07, isUp: false, type: "commodity" },
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

function getTickerHref(item: TickerItem): string {
  if (item.type === "index") {
    return `/markets/indices/${item.symbol}`;
  }
  if (item.type === "currency" || item.type === "commodity") {
    return `/markets`;
  }
  return `/companies/${item.symbol.toLowerCase()}`;
}

function TickerItemComponent({ item }: { item: TickerItem }) {
  return (
    <Link
      href={getTickerHref(item)}
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
  const [tickerData, setTickerData] = useState<TickerItem[]>(fallbackTickerData);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre" | "after">("open");
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const scrollPosition = useRef(0);
  const lastFetchRef = useRef<number>(0);

  // Fetch dynamic ticker data from API
  const fetchTickerData = async () => {
    try {
      setIsLoading(true);
      const [tickerTape, indices] = await Promise.all([
        marketService.getTickerTape().catch(() => []),
        marketService.getIndices().catch(() => []),
      ]);

      const items: TickerItem[] = [];

      // Add indices
      indices.slice(0, 5).forEach((idx) => {
        const change = parseFloat(String(idx.change || 0));
        const changePercent = parseFloat(String(idx.change_percent || 0));
        items.push({
          symbol: idx.code,
          name: idx.name,
          price: parseFloat(String(idx.current_value || idx.value || 0)),
          change,
          changePercent,
          isUp: change >= 0,
          type: "index",
        });
      });

      // Add companies from ticker tape (mix of exchanges)
      tickerTape.slice(0, 15).forEach((ticker: any) => {
        const change = parseFloat(String(ticker.price_change || ticker.change || 0));
        const changePercent = parseFloat(String(ticker.price_change_percent || ticker.change_percent || 0));
        items.push({
          symbol: ticker.symbol,
          name: ticker.name || ticker.symbol,
          price: parseFloat(String(ticker.current_price || ticker.price || 0)),
          change,
          changePercent,
          isUp: change >= 0,
          exchange: ticker.exchange?.code || ticker.exchange_code,
        });
      });

      // Add static currency/commodity data
      items.push(
        { symbol: "USD/ZAR", name: "Dollar/Rand", price: 18.2345, change: 0.0234, changePercent: 0.13, isUp: true, type: "currency" },
        { symbol: "USD/ZIG", name: "Dollar/ZiG", price: 25.5, change: -0.15, changePercent: -0.58, isUp: false, type: "currency" },
        { symbol: "GOLD", name: "Gold", price: 2678.90, change: 15.40, changePercent: 0.58, isUp: true, type: "commodity" },
        { symbol: "BRENT", name: "Brent Crude", price: 82.34, change: -0.89, changePercent: -1.07, isUp: false, type: "commodity" },
      );

      if (items.length > 0) {
        setTickerData(items);
      }

      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error("Failed to fetch ticker data:", error);
      // Keep using current data or fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchTickerData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchTickerData, 60000);

    return () => clearInterval(interval);
  }, []);

  // Simulate real-time price changes between fetches
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((item) => {
          // Only simulate changes if we haven't fetched in a while
          if (Date.now() - lastFetchRef.current < 10000) return item;

          const volatility = item.type === "currency" ? 0.0001 : item.type === "index" ? 0.0005 : 0.001;
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
    }, 5000);

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
          <button
            onClick={fetchTickerData}
            className={cn(
              "p-1 text-muted-foreground hover:text-foreground transition-colors",
              isLoading && "animate-spin"
            )}
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3" />
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
