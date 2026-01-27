"use client";

/**
 * Market Data Hooks
 *
 * SWR hooks for fetching market data, companies, indices, and more.
 * Features:
 * - Real-time data updates with configurable refresh intervals
 * - Automatic caching and deduplication
 * - Error handling and loading states
 */
import useSWR from "swr";
import { marketService } from "@/services/api/market";
import type {
  Company,
  Exchange,
  MarketIndex,
  TickerData,
  ChartData,
  PaginatedResponse,
  Sector,
} from "@/types";

// =========================
// Exchanges
// =========================

export function useExchanges() {
  return useSWR<Exchange[]>(
    "/markets/exchanges/",
    () => marketService.getExchanges(),
    {
      // Exchanges rarely change
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );
}

export function useExchange(code: string | null) {
  return useSWR<Exchange>(
    code ? `/markets/exchanges/${code}/` : null,
    () => marketService.getExchange(code!),
    {
      revalidateOnFocus: false,
    }
  );
}

// =========================
// Sectors
// =========================

export function useSectors() {
  return useSWR<Sector[]>(
    "/markets/sectors/",
    () => marketService.getSectors(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

// =========================
// Companies
// =========================

export interface UseCompaniesParams {
  exchange?: string;
  sector?: string;
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export function useCompanies(params?: UseCompaniesParams) {
  const paramString = params ? JSON.stringify(params) : "";
  const key = `/markets/companies/?${paramString}`;

  return useSWR<PaginatedResponse<Company>>(
    key,
    () => marketService.getCompanies(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  );
}

export function useCompany(symbol: string | null) {
  return useSWR<Company>(
    symbol ? `/markets/companies/${symbol}/` : null,
    () => marketService.getCompany(symbol!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
}

export function useCompanySearch(query: string | null) {
  return useSWR<PaginatedResponse<Company>>(
    query && query.length >= 2 ? `/markets/companies/search?q=${query}` : null,
    () => marketService.searchCompanies(query!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
}

// =========================
// Top Movers
// =========================

export function useGainers(exchange?: string, limit: number = 10) {
  return useSWR<Company[]>(
    `/markets/companies/gainers/?exchange=${exchange || ""}&limit=${limit}`,
    () => marketService.getGainers(exchange, limit),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 seconds
      refreshInterval: 60000, // Auto-refresh every minute
    }
  );
}

export function useLosers(exchange?: string, limit: number = 10) {
  return useSWR<Company[]>(
    `/markets/companies/losers/?exchange=${exchange || ""}&limit=${limit}`,
    () => marketService.getLosers(exchange, limit),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  );
}

export function useMostActive(exchange?: string, limit: number = 10) {
  return useSWR<Company[]>(
    `/markets/companies/most-active/?exchange=${exchange || ""}&limit=${limit}`,
    () => marketService.getMostActive(exchange, limit),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  );
}

// =========================
// Ticker Tape
// =========================

export function useTickerTape() {
  return useSWR<TickerData[]>(
    "/markets/companies/ticker_tape/",
    () => marketService.getTickerTape(),
    {
      // Ticker tape needs frequent updates for real-time feel
      revalidateOnFocus: true,
      dedupingInterval: 15000, // 15 seconds
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );
}

// =========================
// Chart Data
// =========================

export interface UseChartDataParams {
  interval?: string;
  period?: string;
}

export function useChartData(companyId: string | null, params?: UseChartDataParams) {
  const paramString = params ? JSON.stringify(params) : "";
  const key = companyId ? `/markets/companies/${companyId}/chart/?${paramString}` : null;

  return useSWR<{ symbol: string; interval: string; period: string; data: ChartData[] }>(
    key,
    () => marketService.getChartData(companyId!, params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );
}

// =========================
// Market Indices
// =========================

export function useIndices(exchange?: string) {
  return useSWR<MarketIndex[]>(
    `/markets/indices/summary/?exchange=${exchange || ""}`,
    () => marketService.getIndices(exchange),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      refreshInterval: 60000, // Auto-refresh every minute
    }
  );
}

export function useIndex(code: string | null) {
  return useSWR<MarketIndex>(
    code ? `/markets/indices/${code}/` : null,
    () => marketService.getIndex(code!),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );
}

// =========================
// Combined Hooks for Dashboard
// =========================

export function useMarketOverview(exchange?: string) {
  const { data: indices, isLoading: indicesLoading, error: indicesError } = useIndices(exchange);
  const { data: gainers, isLoading: gainersLoading, error: gainersError } = useGainers(exchange, 5);
  const { data: losers, isLoading: losersLoading, error: losersError } = useLosers(exchange, 5);
  const { data: mostActive, isLoading: activeLoading, error: activeError } = useMostActive(exchange, 5);

  return {
    indices,
    gainers,
    losers,
    mostActive,
    isLoading: indicesLoading || gainersLoading || losersLoading || activeLoading,
    error: indicesError || gainersError || losersError || activeError,
  };
}
