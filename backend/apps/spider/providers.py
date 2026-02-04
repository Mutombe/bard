"""
External Data Providers

Provides market data from Polygon.io and news from NewsAPI.org
as fallback when direct scraping fails.
"""
import logging
import os
from decimal import Decimal
from functools import wraps
from typing import Optional

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def get_api_key(key_name: str, env_var: str) -> str:
    """Get API key from settings or environment variable."""
    # First try Django settings
    key = getattr(settings, key_name, None)
    if key:
        return key
    # Then try environment variable
    key = os.environ.get(env_var, "")
    if not key:
        logger.warning(f"{env_var} not configured. Some features may not work.")
    return key


# API Keys from environment/settings
POLYGON_API_KEY = get_api_key('POLYGON_API_KEY', 'POLYGON_API_KEY')
NEWSAPI_KEY = get_api_key('NEWSAPI_KEY', 'NEWSAPI_KEY')
ALPHA_VANTAGE_KEY = get_api_key('ALPHA_VANTAGE_KEY', 'ALPHA_VANTAGE_KEY')


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


class AlphaVantageProvider:
    """
    Provides market data from Alpha Vantage API.

    Great for global market data including African markets.
    Free tier: 5 API calls/minute, 500 calls/day.
    """

    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: str = None):
        import requests
        self.api_key = api_key or ALPHA_VANTAGE_KEY
        self.session = requests.Session()

    def _make_request(self, params: dict) -> Optional[dict]:
        """Make API request to Alpha Vantage."""
        params['apikey'] = self.api_key
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            # Check for API error messages
            if 'Error Message' in data:
                logger.error(f"Alpha Vantage error: {data['Error Message']}")
                return None
            if 'Note' in data:
                logger.warning(f"Alpha Vantage rate limit: {data['Note']}")
                return None

            return data
        except Exception as e:
            logger.error(f"Alpha Vantage request failed: {e}")
            return None

    def get_quote(self, symbol: str) -> Optional[dict]:
        """Get real-time quote for a symbol."""
        data = self._make_request({
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
        })

        if not data or 'Global Quote' not in data:
            return None

        quote = data['Global Quote']
        return {
            'symbol': quote.get('01. symbol', symbol),
            'price': Decimal(quote.get('05. price', '0')),
            'open': Decimal(quote.get('02. open', '0')),
            'high': Decimal(quote.get('03. high', '0')),
            'low': Decimal(quote.get('04. low', '0')),
            'volume': int(quote.get('06. volume', 0)),
            'previous_close': Decimal(quote.get('08. previous close', '0')),
            'change': Decimal(quote.get('09. change', '0')),
            'change_percent': quote.get('10. change percent', '0%').replace('%', ''),
        }

    def get_daily_bars(self, symbol: str, outputsize: str = 'compact') -> list[dict]:
        """
        Get daily OHLCV data for a symbol.

        Args:
            symbol: Stock symbol (e.g., 'MSFT', 'JSE:SBK')
            outputsize: 'compact' (last 100 days) or 'full' (20+ years)
        """
        data = self._make_request({
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'outputsize': outputsize,
        })

        if not data or 'Time Series (Daily)' not in data:
            return []

        bars = []
        for date_str, ohlcv in data['Time Series (Daily)'].items():
            bars.append({
                'date': date_str,
                'open': Decimal(ohlcv['1. open']),
                'high': Decimal(ohlcv['2. high']),
                'low': Decimal(ohlcv['3. low']),
                'close': Decimal(ohlcv['4. close']),
                'volume': int(ohlcv['5. volume']),
            })

        # Sort by date descending
        bars.sort(key=lambda x: x['date'], reverse=True)
        return bars

    def get_intraday(self, symbol: str, interval: str = '5min') -> list[dict]:
        """
        Get intraday data for a symbol.

        Args:
            symbol: Stock symbol
            interval: 1min, 5min, 15min, 30min, 60min
        """
        data = self._make_request({
            'function': 'TIME_SERIES_INTRADAY',
            'symbol': symbol,
            'interval': interval,
        })

        key = f'Time Series ({interval})'
        if not data or key not in data:
            return []

        bars = []
        for timestamp, ohlcv in data[key].items():
            bars.append({
                'timestamp': timestamp,
                'open': Decimal(ohlcv['1. open']),
                'high': Decimal(ohlcv['2. high']),
                'low': Decimal(ohlcv['3. low']),
                'close': Decimal(ohlcv['4. close']),
                'volume': int(ohlcv['5. volume']),
            })

        bars.sort(key=lambda x: x['timestamp'], reverse=True)
        return bars

    def search_symbol(self, keywords: str) -> list[dict]:
        """Search for symbols by company name or keywords."""
        data = self._make_request({
            'function': 'SYMBOL_SEARCH',
            'keywords': keywords,
        })

        if not data or 'bestMatches' not in data:
            return []

        matches = []
        for match in data['bestMatches']:
            matches.append({
                'symbol': match.get('1. symbol', ''),
                'name': match.get('2. name', ''),
                'type': match.get('3. type', ''),
                'region': match.get('4. region', ''),
                'currency': match.get('8. currency', 'USD'),
            })

        return matches

    def get_forex_rate(self, from_currency: str, to_currency: str) -> Optional[dict]:
        """Get forex exchange rate."""
        data = self._make_request({
            'function': 'CURRENCY_EXCHANGE_RATE',
            'from_currency': from_currency,
            'to_currency': to_currency,
        })

        if not data or 'Realtime Currency Exchange Rate' not in data:
            return None

        rate = data['Realtime Currency Exchange Rate']
        return {
            'from_currency': rate.get('1. From_Currency Code', from_currency),
            'to_currency': rate.get('3. To_Currency Code', to_currency),
            'exchange_rate': Decimal(rate.get('5. Exchange Rate', '0')),
            'last_refreshed': rate.get('6. Last Refreshed', ''),
        }

    def get_company_overview(self, symbol: str) -> Optional[dict]:
        """Get fundamental data and company overview."""
        data = self._make_request({
            'function': 'OVERVIEW',
            'symbol': symbol,
        })

        if not data or 'Symbol' not in data:
            return None

        return {
            'symbol': data.get('Symbol', symbol),
            'name': data.get('Name', ''),
            'description': data.get('Description', ''),
            'exchange': data.get('Exchange', ''),
            'currency': data.get('Currency', 'USD'),
            'country': data.get('Country', ''),
            'sector': data.get('Sector', ''),
            'industry': data.get('Industry', ''),
            'market_cap': data.get('MarketCapitalization', ''),
            'pe_ratio': data.get('PERatio', ''),
            'dividend_yield': data.get('DividendYield', ''),
            'eps': data.get('EPS', ''),
            '52_week_high': data.get('52WeekHigh', ''),
            '52_week_low': data.get('52WeekLow', ''),
        }


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


def fetch_alpha_vantage_quote(symbol: str) -> Optional[dict]:
    """Fetch real-time quote from Alpha Vantage."""
    provider = AlphaVantageProvider()
    return provider.get_quote(symbol)


def fetch_alpha_vantage_daily(symbol: str, outputsize: str = 'compact') -> list[dict]:
    """Fetch daily price data from Alpha Vantage."""
    provider = AlphaVantageProvider()
    return provider.get_daily_bars(symbol, outputsize)


def fetch_alpha_vantage_company(symbol: str) -> Optional[dict]:
    """Fetch company overview from Alpha Vantage."""
    provider = AlphaVantageProvider()
    return provider.get_company_overview(symbol)


def search_alpha_vantage_symbol(keywords: str) -> list[dict]:
    """Search for symbols on Alpha Vantage."""
    provider = AlphaVantageProvider()
    return provider.search_symbol(keywords)


def fetch_forex_rate(from_currency: str, to_currency: str) -> Optional[dict]:
    """Fetch forex rate from Alpha Vantage."""
    provider = AlphaVantageProvider()
    return provider.get_forex_rate(from_currency, to_currency)
