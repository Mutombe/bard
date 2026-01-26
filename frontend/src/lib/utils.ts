import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import numeral from "numeral";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency
 */
export function formatCurrency(
  value: number,
  currency: string = "ZAR",
  compact: boolean = false
): string {
  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: compact ? "compact" : "standard",
  });
  return formatter.format(value);
}

/**
 * Format number with appropriate precision for stock prices
 */
export function formatPrice(value: number): string {
  if (value >= 1000) {
    return numeral(value).format("0,0.00");
  }
  if (value >= 1) {
    return numeral(value).format("0.00");
  }
  return numeral(value).format("0.0000");
}

/**
 * Format percentage change
 */
export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${numeral(value).format("0.00")}%`;
}

/**
 * Format large numbers (market cap, volume)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return numeral(value).format("0.00a").toUpperCase();
  }
  if (value >= 1e9) {
    return numeral(value).format("0.00a").toUpperCase();
  }
  if (value >= 1e6) {
    return numeral(value).format("0.00a").toUpperCase();
  }
  if (value >= 1e3) {
    return numeral(value).format("0.00a").toUpperCase();
  }
  return numeral(value).format("0,0");
}

/**
 * Format volume
 */
export function formatVolume(value: number): string {
  return formatLargeNumber(value);
}

/**
 * Format date/time
 */
export function formatDateTime(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-ZA", options || defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  return formatDateTime(date, { month: "short", day: "numeric" });
}

/**
 * Get price change color class
 */
export function getPriceColorClass(change: number): string {
  if (change > 0) return "text-market-up";
  if (change < 0) return "text-market-down";
  return "text-muted-foreground";
}

/**
 * Get background color class based on price change
 */
export function getPriceBgClass(change: number): string {
  if (change > 0) return "bg-market-up-bg";
  if (change < 0) return "bg-market-down-bg";
  return "bg-terminal-bg-elevated";
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
