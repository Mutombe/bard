/**
 * NewsAPI.org Service
 * Business and financial news from multiple sources
 */

const NEWS_API_KEY = '501dd05c42a34918a11dd241f9e1856d';
const BASE_URL = 'https://newsapi.org/v2';

interface NewsSource {
  id: string | null;
  name: string;
}

interface NewsArticle {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

type Country = 'ae' | 'ar' | 'at' | 'au' | 'be' | 'bg' | 'br' | 'ca' | 'ch' | 'cn' |
  'co' | 'cu' | 'cz' | 'de' | 'eg' | 'fr' | 'gb' | 'gr' | 'hk' | 'hu' | 'id' | 'ie' |
  'il' | 'in' | 'it' | 'jp' | 'kr' | 'lt' | 'lv' | 'ma' | 'mx' | 'my' | 'ng' | 'nl' |
  'no' | 'nz' | 'ph' | 'pl' | 'pt' | 'ro' | 'rs' | 'ru' | 'sa' | 'se' | 'sg' | 'si' |
  'sk' | 'th' | 'tr' | 'tw' | 'ua' | 'us' | 've' | 'za';

type Category = 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';

class NewsAPIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = NEWS_API_KEY;
    this.baseUrl = BASE_URL;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apiKey', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `NewsAPI error: ${response.status}`);
    }

    return response.json();
  }

  // Get top headlines
  async getTopHeadlines(params: {
    country?: Country;
    category?: Category;
    sources?: string;
    q?: string;
    pageSize?: number;
    page?: number;
  } = {}): Promise<NewsResponse> {
    const queryParams: Record<string, string> = {};

    if (params.country) queryParams.country = params.country;
    if (params.category) queryParams.category = params.category;
    if (params.sources) queryParams.sources = params.sources;
    if (params.q) queryParams.q = params.q;
    if (params.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params.page) queryParams.page = String(params.page);

    return this.fetch<NewsResponse>('/top-headlines', queryParams);
  }

  // Get business news
  async getBusinessNews(country: Country = 'us', pageSize: number = 20): Promise<NewsArticle[]> {
    const response = await this.getTopHeadlines({
      country,
      category: 'business',
      pageSize,
    });
    return response.articles;
  }

  // Get South African business news
  async getSouthAfricanNews(pageSize: number = 20): Promise<NewsArticle[]> {
    return this.getBusinessNews('za', pageSize);
  }

  // Get Nigerian business news
  async getNigerianNews(pageSize: number = 20): Promise<NewsArticle[]> {
    return this.getBusinessNews('ng', pageSize);
  }

  // Search everything
  async searchNews(params: {
    q: string;
    searchIn?: 'title' | 'description' | 'content';
    sources?: string;
    domains?: string;
    excludeDomains?: string;
    from?: string;
    to?: string;
    language?: string;
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
    page?: number;
  }): Promise<NewsResponse> {
    const queryParams: Record<string, string> = {
      q: params.q,
    };

    if (params.searchIn) queryParams.searchIn = params.searchIn;
    if (params.sources) queryParams.sources = params.sources;
    if (params.domains) queryParams.domains = params.domains;
    if (params.excludeDomains) queryParams.excludeDomains = params.excludeDomains;
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    if (params.language) queryParams.language = params.language;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params.page) queryParams.page = String(params.page);

    return this.fetch<NewsResponse>('/everything', queryParams);
  }

  // Get African market news
  async getAfricanMarketNews(pageSize: number = 30): Promise<NewsArticle[]> {
    const response = await this.searchNews({
      q: 'Africa stock market OR JSE OR Nigerian Stock Exchange OR Africa economy OR Africa business',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
    });
    return response.articles;
  }

  // Get commodity news
  async getCommodityNews(pageSize: number = 20): Promise<NewsArticle[]> {
    const response = await this.searchNews({
      q: 'gold price OR oil price OR commodities OR mining Africa',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
    });
    return response.articles;
  }

  // Get currency news
  async getCurrencyNews(pageSize: number = 20): Promise<NewsArticle[]> {
    const response = await this.searchNews({
      q: 'ZAR USD OR Rand dollar OR Nigerian Naira OR African currency',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
    });
    return response.articles;
  }

  // Get sources
  async getSources(params: {
    category?: Category;
    language?: string;
    country?: Country;
  } = {}): Promise<{ sources: NewsSource[] }> {
    const queryParams: Record<string, string> = {};

    if (params.category) queryParams.category = params.category;
    if (params.language) queryParams.language = params.language;
    if (params.country) queryParams.country = params.country;

    return this.fetch('/top-headlines/sources', queryParams);
  }
}

export const newsAPIService = new NewsAPIService();
export type { NewsArticle, NewsSource, NewsResponse, Country, Category };
