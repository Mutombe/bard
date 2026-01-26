"""
External Data Providers

Provides market data from Polygon.io and news from NewsAPI.org
as fallback when direct scraping fails.
"""
import logging
from decimal import Decimal
from typing import Optional

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# API Keys - ideally should be in settings/env
POLYGON_API_KEY = getattr(settings, 'POLYGON_API_KEY', 'l8TQKKpACZBUho4kUWgAdOp_jZfuhWgz')
NEWSAPI_KEY = getattr(settings, 'NEWSAPI_KEY', '501dd05c42a34918a11dd241f9e1856d')


class PolygonDataProvider:
    """
    Provides market data from Polygon.io API.

    Supports US and international market data including indices.
    """

    def __init__(self, api_key: str = None):
        from polygon import RESTClient
        self.api_key = api_key or POLYGON_API_KEY
        self.client = RESTClient(self.api_key)

    def get_tickers(self, market: str = "stocks", limit: int = 100) -> list[dict]:
        """
        Get list of tickers from Polygon.

        Args:
            market: Market type - 'stocks', 'indices', 'crypto', 'fx'
            limit: Max number of tickers to return
        """
        tickers = []
        try:
            for t in self.client.list_tickers(
                market=market,
                active="true",
                order="asc",
                limit=str(limit),
                sort="ticker",
            ):
                tickers.append({
                    'symbol': t.ticker,
                    'name': t.name,
                    'market': t.market,
                    'currency': getattr(t, 'currency_name', 'USD'),
                    'exchange': getattr(t, 'primary_exchange', ''),
                })
        except Exception as e:
            logger.error(f"Polygon get_tickers failed: {e}")
        return tickers

    def get_ticker_details(self, symbol: str) -> Optional[dict]:
        """Get detailed info for a specific ticker."""
        try:
            details = self.client.get_ticker_details(symbol)
            return {
                'symbol': details.ticker,
                'name': details.name,
                'market_cap': getattr(details, 'market_cap', None),
                'description': getattr(details, 'description', ''),
                'homepage_url': getattr(details, 'homepage_url', ''),
                'total_employees': getattr(details, 'total_employees', None),
            }
        except Exception as e:
            logger.error(f"Polygon get_ticker_details failed for {symbol}: {e}")
            return None

    def get_daily_bars(self, symbol: str, days: int = 30) -> list[dict]:
        """Get daily OHLCV data for a ticker."""
        from datetime import datetime, timedelta

        bars = []
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            for bar in self.client.list_aggs(
                ticker=symbol,
                multiplier=1,
                timespan="day",
                from_=start_date.strftime("%Y-%m-%d"),
                to=end_date.strftime("%Y-%m-%d"),
                limit=days,
            ):
                bars.append({
                    'timestamp': datetime.fromtimestamp(bar.timestamp / 1000),
                    'open': Decimal(str(bar.open)),
                    'high': Decimal(str(bar.high)),
                    'low': Decimal(str(bar.low)),
                    'close': Decimal(str(bar.close)),
                    'volume': bar.volume,
                })
        except Exception as e:
            logger.error(f"Polygon get_daily_bars failed for {symbol}: {e}")
        return bars

    def get_previous_close(self, symbol: str) -> Optional[dict]:
        """Get previous day's close data."""
        try:
            result = self.client.get_previous_close_agg(symbol)
            if result and result.results:
                bar = result.results[0]
                return {
                    'symbol': symbol,
                    'open': Decimal(str(bar.o)),
                    'high': Decimal(str(bar.h)),
                    'low': Decimal(str(bar.l)),
                    'close': Decimal(str(bar.c)),
                    'volume': bar.v,
                }
        except Exception as e:
            logger.error(f"Polygon get_previous_close failed for {symbol}: {e}")
        return None

    def get_indices(self, limit: int = 50) -> list[dict]:
        """Get market indices data."""
        return self.get_tickers(market="indices", limit=limit)

    def get_ticker_news(self, ticker: str = None, limit: int = 20) -> list[dict]:
        """Get news for a ticker or general market news."""
        news_items = []
        try:
            params = {
                'order': 'desc',
                'limit': str(limit),
                'sort': 'published_utc',
            }
            if ticker:
                params['ticker'] = ticker

            for item in self.client.list_ticker_news(**params):
                # Handle publisher - can be object or dict
                publisher = getattr(item, 'publisher', None)
                if publisher:
                    source = getattr(publisher, 'name', 'Unknown') if hasattr(publisher, 'name') else str(publisher)
                else:
                    source = 'Unknown'

                news_items.append({
                    'title': item.title,
                    'description': getattr(item, 'description', ''),
                    'url': getattr(item, 'article_url', ''),
                    'image_url': getattr(item, 'image_url', ''),
                    'published_at': getattr(item, 'published_utc', ''),
                    'source': source,
                    'tickers': getattr(item, 'tickers', []),
                })
        except Exception as e:
            logger.error(f"Polygon get_ticker_news failed: {e}")
        return news_items


class NewsAPIProvider:
    """
    Provides news from NewsAPI.org.

    Great for business and financial news from multiple sources.
    """

    def __init__(self, api_key: str = None):
        from newsapi import NewsApiClient
        self.api_key = api_key or NEWSAPI_KEY
        self.client = NewsApiClient(api_key=self.api_key)

    def get_top_headlines(
        self,
        category: str = 'business',
        country: str = 'us',
        page_size: int = 20
    ) -> list[dict]:
        """
        Get top headlines for a category.

        Args:
            category: business, technology, general, etc.
            country: Country code (us, gb, za, etc.)
            page_size: Number of articles to return
        """
        articles = []
        try:
            response = self.client.get_top_headlines(
                category=category,
                country=country,
                page_size=page_size,
            )

            if response.get('status') == 'ok':
                for article in response.get('articles', []):
                    articles.append({
                        'title': article.get('title', ''),
                        'description': article.get('description', ''),
                        'content': article.get('content', ''),
                        'url': article.get('url', ''),
                        'image_url': article.get('urlToImage', ''),
                        'published_at': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', 'Unknown'),
                        'author': article.get('author', ''),
                    })
        except Exception as e:
            logger.error(f"NewsAPI get_top_headlines failed: {e}")
        return articles

    def search_news(
        self,
        query: str,
        language: str = 'en',
        sort_by: str = 'publishedAt',
        page_size: int = 20
    ) -> list[dict]:
        """
        Search for news articles.

        Args:
            query: Search query (e.g., 'stock market', 'bitcoin')
            language: Language code
            sort_by: relevancy, popularity, publishedAt
            page_size: Number of articles to return
        """
        articles = []
        try:
            response = self.client.get_everything(
                q=query,
                language=language,
                sort_by=sort_by,
                page_size=page_size,
            )

            if response.get('status') == 'ok':
                for article in response.get('articles', []):
                    articles.append({
                        'title': article.get('title', ''),
                        'description': article.get('description', ''),
                        'content': article.get('content', ''),
                        'url': article.get('url', ''),
                        'image_url': article.get('urlToImage', ''),
                        'published_at': article.get('publishedAt', ''),
                        'source': article.get('source', {}).get('name', 'Unknown'),
                        'author': article.get('author', ''),
                    })
        except Exception as e:
            logger.error(f"NewsAPI search_news failed: {e}")
        return articles

    def get_african_market_news(self, page_size: int = 20) -> list[dict]:
        """Get news specifically about African markets."""
        queries = [
            'South Africa stock market',
            'Nigeria stock exchange',
            'African economy',
            'JSE Johannesburg',
        ]

        all_articles = []
        for query in queries:
            articles = self.search_news(query, page_size=page_size // len(queries))
            all_articles.extend(articles)

        # Sort by published date
        all_articles.sort(
            key=lambda x: x.get('published_at', ''),
            reverse=True
        )

        return all_articles[:page_size]


# Convenience functions
def fetch_polygon_market_data(symbol: str) -> Optional[dict]:
    """Fetch market data for a symbol from Polygon."""
    provider = PolygonDataProvider()
    return provider.get_previous_close(symbol)


def fetch_business_news(limit: int = 20) -> list[dict]:
    """Fetch business news from NewsAPI."""
    provider = NewsAPIProvider()
    return provider.get_top_headlines(category='business', page_size=limit)


def fetch_african_news(limit: int = 20) -> list[dict]:
    """Fetch African market news."""
    provider = NewsAPIProvider()
    return provider.get_african_market_news(page_size=limit)


def fetch_polygon_news(ticker: str = None, limit: int = 20) -> list[dict]:
    """Fetch financial news from Polygon."""
    provider = PolygonDataProvider()
    return provider.get_ticker_news(ticker=ticker, limit=limit)
