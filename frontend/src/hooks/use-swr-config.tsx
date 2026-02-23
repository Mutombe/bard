"use client";

/**
 * SWR Configuration Provider
 *
 * Provides global SWR configuration for the application:
 * - Automatic revalidation on focus
 * - Retry on error
 * - Deduplication of requests
 * - Smart caching
 */
import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { publicClient } from "@/services/api/client";

// Default fetcher using axios
export const fetcher = async (url: string) => {
  const response = await publicClient.get(url);
  return response.data;
};

// SWR configuration options
const swrConfig = {
  fetcher,
  // Revalidate on focus (when user comes back to tab) - disabled to prevent flashing
  revalidateOnFocus: false,
  // Revalidate when reconnecting to network
  revalidateOnReconnect: true,
  // Dedupe requests within 5 seconds to reduce API calls
  dedupingInterval: 5000,
  // Keep previous data while revalidating - critical to prevent flashing
  keepPreviousData: true,
  // Error retry configuration - reduced to prevent flashing on errors
  errorRetryCount: 1,
  errorRetryInterval: 5000,
  // Should retry on error - but with backoff
  shouldRetryOnError: (error: Error) => {
    // Don't retry on 404s or auth errors
    const axiosError = error as any;
    if (axiosError?.response?.status === 404 || axiosError?.response?.status === 401) {
      return false;
    }
    return true;
  },
  // Revalidate stale data to keep content fresh
  revalidateIfStale: true,
  // Loading timeout (show loading state if request takes longer)
  loadingTimeout: 10000,
  // Focus throttle (prevent too many requests on rapid focus changes)
  focusThrottleInterval: 30000,
  // Callback for global error handling
  onError: (error: Error, key: string) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`SWR Error [${key}]:`, error);
    }
  },
  // Fallback data to prevent undefined states
  fallback: {},
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
