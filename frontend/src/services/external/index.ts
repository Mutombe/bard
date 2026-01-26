/**
 * External API Services
 */

export { polygonService } from './polygon';
export type { TickerResult, AggregateBar, TickerDetails, TickerSnapshot, NewsArticle as PolygonNewsArticle, MarketStatus } from './polygon';

export { newsAPIService } from './newsapi';
export type { NewsArticle as NewsAPIArticle, NewsSource, NewsResponse, Country, Category } from './newsapi';

export { africanMarketsService, AFRICAN_INDICES, JSE_TOP_STOCKS, NGX_TOP_STOCKS } from './african-markets';
export type { MarketIndex, StockQuote } from './african-markets';
