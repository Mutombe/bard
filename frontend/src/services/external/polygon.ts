/**
 * Polygon.io / Massive.com API Service
 * Real-time and historical market data
 */

const POLYGON_API_KEY = 'l8TQKKpACZBUho4kUWgAdOp_jZfuhWgz';
const BASE_URL = 'https://api.polygon.io';

interface TickerResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  last_updated_utc?: string;
}

interface AggregateBar {
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
  vw: number; // volume weighted average
  t: number;  // timestamp
  n: number;  // number of transactions
}

interface TickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  description?: string;
  sic_code?: string;
  sic_description?: string;
  ticker_root?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url: string;
    icon_url: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
}

interface TickerSnapshot {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  day: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  prevDay: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
}

interface NewsArticle {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  image_url: string;
  description: string;
  keywords: string[];
}

interface MarketStatus {
  market: string;
  serverTime: string;
  exchanges: {
    [key: string]: string;
  };
  currencies: {
    [key: string]: string;
  };
}

class PolygonService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = POLYGON_API_KEY;
    this.baseUrl = BASE_URL;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apiKey', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    return response.json();
  }

  // Get list of tickers
  async getTickers(params: {
    market?: 'stocks' | 'crypto' | 'fx' | 'otc' | 'indices';
    exchange?: string;
    type?: string;
    active?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    search?: string;
  } = {}): Promise<TickerResult[]> {
    const queryParams: Record<string, string> = {};

    if (params.market) queryParams.market = params.market;
    if (params.exchange) queryParams.exchange = params.exchange;
    if (params.type) queryParams.type = params.type;
    if (params.active !== undefined) queryParams.active = String(params.active);
    if (params.sort) queryParams.sort = params.sort;
    if (params.order) queryParams.order = params.order;
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.search) queryParams.search = params.search;

    const data = await this.fetch<{ results: TickerResult[] }>('/v3/reference/tickers', queryParams);
    return data.results || [];
  }

  // Get ticker details
  async getTickerDetails(ticker: string): Promise<TickerDetails | null> {
    try {
      const data = await this.fetch<{ results: TickerDetails }>(`/v3/reference/tickers/${ticker}`);
      return data.results;
    } catch {
      return null;
    }
  }

  // Get aggregate bars (OHLCV)
  async getAggregates(
    ticker: string,
    multiplier: number,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    from: string,
    to: string,
    params: {
      adjusted?: boolean;
      sort?: 'asc' | 'desc';
      limit?: number;
    } = {}
  ): Promise<AggregateBar[]> {
    const queryParams: Record<string, string> = {};

    if (params.adjusted !== undefined) queryParams.adjusted = String(params.adjusted);
    if (params.sort) queryParams.sort = params.sort;
    if (params.limit) queryParams.limit = String(params.limit);

    const data = await this.fetch<{ results: AggregateBar[] }>(
      `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`,
      queryParams
    );
    return data.results || [];
  }

  // Get previous day's data
  async getPreviousClose(ticker: string): Promise<AggregateBar | null> {
    try {
      const data = await this.fetch<{ results: AggregateBar[] }>(`/v2/aggs/ticker/${ticker}/prev`);
      return data.results?.[0] || null;
    } catch {
      return null;
    }
  }

  // Get snapshot for all tickers
  async getAllTickersSnapshot(market: 'stocks' | 'crypto' | 'fx' = 'stocks'): Promise<TickerSnapshot[]> {
    try {
      const endpoint = market === 'stocks'
        ? '/v2/snapshot/locale/us/markets/stocks/tickers'
        : market === 'crypto'
        ? '/v2/snapshot/locale/global/markets/crypto/tickers'
        : '/v2/snapshot/locale/global/markets/forex/tickers';

      const data = await this.fetch<{ tickers: TickerSnapshot[] }>(endpoint);
      return data.tickers || [];
    } catch {
      return [];
    }
  }

  // Get snapshot for specific ticker
  async getTickerSnapshot(ticker: string): Promise<TickerSnapshot | null> {
    try {
      const data = await this.fetch<{ ticker: TickerSnapshot }>(
        `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`
      );
      return data.ticker;
    } catch {
      return null;
    }
  }

  // Get gainers/losers
  async getGainersLosers(direction: 'gainers' | 'losers'): Promise<TickerSnapshot[]> {
    try {
      const data = await this.fetch<{ tickers: TickerSnapshot[] }>(
        `/v2/snapshot/locale/us/markets/stocks/${direction}`
      );
      return data.tickers || [];
    } catch {
      return [];
    }
  }

  // Get market news
  async getNews(params: {
    ticker?: string;
    published_utc_gte?: string;
    published_utc_lte?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  } = {}): Promise<NewsArticle[]> {
    const queryParams: Record<string, string> = {};

    if (params.ticker) queryParams.ticker = params.ticker;
    if (params.published_utc_gte) queryParams['published_utc.gte'] = params.published_utc_gte;
    if (params.published_utc_lte) queryParams['published_utc.lte'] = params.published_utc_lte;
    if (params.order) queryParams.order = params.order;
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.sort) queryParams.sort = params.sort;

    const data = await this.fetch<{ results: NewsArticle[] }>('/v2/reference/news', queryParams);
    return data.results || [];
  }

  // Get market status
  async getMarketStatus(): Promise<MarketStatus | null> {
    try {
      const data = await this.fetch<MarketStatus>('/v1/marketstatus/now');
      return data;
    } catch {
      return null;
    }
  }

  // Get indices (I: prefix)
  async getIndices(limit: number = 20): Promise<TickerResult[]> {
    return this.getTickers({
      market: 'indices',
      active: true,
      limit,
      sort: 'ticker',
      order: 'asc',
    });
  }
}

export const polygonService = new PolygonService();
export type { TickerResult, AggregateBar, TickerDetails, TickerSnapshot, NewsArticle, MarketStatus };
