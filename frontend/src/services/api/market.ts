import { publicClient } from "./client";
import type {
  Company,
  Exchange,
  MarketIndex,
  TickerData,
  ChartData,
  PaginatedResponse,
  Sector,
} from "@/types";

export const marketService = {
  // =========================
  // Exchanges
  // =========================

  async getExchanges(): Promise<Exchange[]> {
    const response = await publicClient.get<Exchange[]>("/markets/exchanges/");
    return response.data;
  },

  async getExchange(code: string): Promise<Exchange> {
    const response = await publicClient.get<Exchange>(`/markets/exchanges/${code}/`);
    return response.data;
  },

  // =========================
  // Sectors
  // =========================

  async getSectors(): Promise<Sector[]> {
    const response = await publicClient.get<Sector[]>("/markets/sectors/");
    return response.data;
  },

  // =========================
  // Companies
  // =========================

  async getCompanies(params?: {
    exchange?: string;
    sector?: string;
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Company>> {
    const response = await publicClient.get<PaginatedResponse<Company>>("/markets/companies/", {
      params,
    });
    return response.data;
  },

  async getCompany(id: string): Promise<Company> {
    const response = await publicClient.get<Company>(`/markets/companies/${id}/`);
    return response.data;
  },

  async searchCompanies(query: string): Promise<PaginatedResponse<Company>> {
    const response = await publicClient.get<PaginatedResponse<Company>>("/markets/companies/", {
      params: { search: query, page_size: 20 },
    });
    return response.data;
  },

  // =========================
  // Top Movers
  // =========================

  async getGainers(exchange?: string, limit: number = 10): Promise<Company[]> {
    const response = await publicClient.get<Company[]>("/markets/companies/gainers/", {
      params: { exchange, limit },
    });
    return response.data;
  },

  async getLosers(exchange?: string, limit: number = 10): Promise<Company[]> {
    const response = await publicClient.get<Company[]>("/markets/companies/losers/", {
      params: { exchange, limit },
    });
    return response.data;
  },

  async getMostActive(exchange?: string, limit: number = 10): Promise<Company[]> {
    const response = await publicClient.get<Company[]>("/markets/companies/most-active/", {
      params: { exchange, limit },
    });
    return response.data;
  },

  // =========================
  // Ticker Tape
  // =========================

  async getTickerTape(): Promise<TickerData[]> {
    const response = await publicClient.get<TickerData[]>("/markets/companies/ticker_tape/");
    return response.data;
  },

  // =========================
  // Chart Data
  // =========================

  async getChartData(
    companyId: string,
    params?: {
      interval?: string;
      period?: string;
    }
  ): Promise<{ symbol: string; interval: string; period: string; data: ChartData[] }> {
    const response = await publicClient.get(`/markets/companies/${companyId}/chart/`, {
      params,
    });
    return response.data;
  },

  // =========================
  // Market Indices
  // =========================

  async getIndices(exchange?: string): Promise<MarketIndex[]> {
    const response = await publicClient.get<MarketIndex[]>("/markets/indices/summary/", {
      params: { exchange },
    });
    return response.data;
  },

  async getIndex(code: string): Promise<MarketIndex> {
    const response = await publicClient.get<MarketIndex>(`/markets/indices/${code}/`);
    return response.data;
  },
};
