"""
External Data Providers

Provides market data from Polygon.io/Massive.com and news from SerpAPI
(Google News) with full article extraction via trafilatura.
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
SERPAPI_KEY = get_api_key('SERPAPI_KEY', 'SERPAPI_KEY')
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


class SerpAPIProvider:
    """
    Provides news from Google News via SerpAPI.

    Uses SerpAPI to discover articles, then trafilatura to extract
    full article content from the source URLs.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or SERPAPI_KEY

    def _search_google_news(self, query: str, gl: str = 'us', hl: str = 'en') -> list[dict]:
        """Run a Google News search via SerpAPI."""
        from serpapi import GoogleSearch

        params = {
            'engine': 'google_news',
            'q': query,
            'gl': gl,
            'hl': hl,
            'api_key': self.api_key,
        }

        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            return results.get('news_results', [])
        except Exception as e:
            logger.error(f"SerpAPI search failed for '{query}': {e}")
            return []

    @staticmethod
    def extract_full_article(url: str) -> Optional[str]:
        """Extract full article text from a URL using trafilatura."""
        import trafilatura

        try:
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                return None
            text = trafilatura.extract(
                downloaded,
                include_comments=False,
                include_tables=False,
            )
            return text
        except Exception as e:
            logger.warning(f"Article extraction failed for {url}: {e}")
            return None

    @staticmethod
    def _is_bad_image_url(url: str) -> bool:
        """Check if an image URL is a low-quality Google News proxy or broken."""
        if not url:
            return True
        bad_patterns = [
            'news.google.com',
            'encrypted-tbn',
            'gstatic.com/images',
            '/s16383/',  # Google News tiny thumbnails
        ]
        return any(p in url for p in bad_patterns)

    def search_news(
        self,
        query: str,
        gl: str = 'us',
        hl: str = 'en',
        extract_content: bool = True,
        min_content_length: int = 200,
    ) -> list[dict]:
        """
        Search Google News and extract full article content.

        Extracts content for ALL articles (no cap). Articles that fail
        extraction or have content shorter than min_content_length are skipped.

        Args:
            query: Search query
            gl: Country code for localization
            hl: Language code
            extract_content: Whether to fetch full article bodies
            min_content_length: Minimum content length to accept an article
        """
        raw_results = self._search_google_news(query, gl=gl, hl=hl)
        articles = []

        for item in raw_results:
            title = (item.get('title') or '').strip()
            if not title:
                continue

            link = item.get('link', '')
            source_info = item.get('source', {})
            snippet = item.get('snippet', '')
            thumbnail = item.get('thumbnail', '')

            # Parse date
            date_str = item.get('date', '')

            # Extract full content for EVERY article
            full_content = None
            if extract_content and link:
                full_content = self.extract_full_article(link)

            # Use full content or snippet
            content = full_content or snippet or ''

            # Skip articles without enough content
            if len(content) < min_content_length:
                logger.debug(f"Skipping article with short content ({len(content)} chars): {title[:60]}")
                continue

            # Filter bad image URLs — leave empty so Unsplash fills in
            image_url = thumbnail or ''
            if self._is_bad_image_url(image_url):
                image_url = ''

            articles.append({
                'title': title,
                'description': snippet or '',
                'content': content,
                'url': link,
                'image_url': image_url,
                'published_at': date_str,
                'source': source_info.get('name', 'Google News') if isinstance(source_info, dict) else str(source_info),
                'author': source_info.get('authors', [''])[0] if isinstance(source_info, dict) and source_info.get('authors') else '',
                'has_full_content': bool(full_content),
            })

        return articles

    def get_business_news(self, gl: str = 'us') -> list[dict]:
        """Get business/finance news headlines with full content."""
        return self.search_news(
            'finance business stock market',
            gl=gl,
        )

    def get_african_market_news(self) -> list[dict]:
        """Get African market and finance news with full content."""
        queries = [
            'Africa finance stock market economy',
            'South Africa JSE market',
            'Nigeria economy finance',
            'Kenya East Africa business',
        ]

        all_articles = []

        for query in queries:
            articles = self.search_news(
                query,
                gl='us',
                extract_content=True,
            )
            all_articles.extend(articles)

        # Deduplicate by title
        seen = set()
        unique = []
        for a in all_articles:
            key = a['title'][:100]
            if key not in seen:
                seen.add(key)
                unique.append(a)

        return unique


# Convenience functions
def fetch_polygon_market_data(symbol: str) -> Optional[dict]:
    """Fetch market data for a symbol from Polygon."""
    provider = PolygonDataProvider()
    return provider.get_previous_close(symbol)


def fetch_business_news(limit: int = 20) -> list[dict]:
    """Fetch business news from SerpAPI (Google News)."""
    provider = SerpAPIProvider()
    return provider.get_business_news()


def fetch_african_news(limit: int = 20) -> list[dict]:
    """Fetch African market news from SerpAPI."""
    provider = SerpAPIProvider()
    return provider.get_african_market_news()


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
