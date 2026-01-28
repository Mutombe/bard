"""
African Financials Spider

Scrapes market data from africanfinancials.com
Supports multiple African exchanges including:
- Victoria Falls Stock Exchange (VFEX)
- Zimbabwe Stock Exchange (ZSE)
- Johannesburg Stock Exchange (JSE)
- And others

Uses Playwright for JavaScript-rendered content.
"""
import logging
import re
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from django.utils import timezone

from apps.spider.base import BaseSpider, ScrapedTickerData

logger = logging.getLogger(__name__)


class AfricanFinancialsSpider(BaseSpider):
    """
    Spider for scraping africanfinancials.com

    This site provides comprehensive African stock market data.
    Uses Playwright because the site blocks simple HTTP requests.
    """

    BASE_URL = "https://africanfinancials.com"
    EXCHANGE_CODE = "MULTI"  # Multi-exchange spider

    # Page URLs for different exchanges
    EXCHANGE_PAGES = {
        "VFEX": "/victoria-falls-stock-exchange-share-prices/",
        "ZSE": "/zimbabwe-stock-exchange-share-prices/",
        "JSE": "/johannesburg-stock-exchange-share-prices/",
        "BSE": "/botswana-stock-exchange-share-prices/",
        "NSE": "/nigeria-stock-exchange-share-prices/",
        "GSE": "/ghana-stock-exchange-share-prices/",
        "NSE_KE": "/nairobi-securities-exchange-share-prices/",
        "LuSE": "/lusaka-stock-exchange-share-prices/",
        "DSE": "/dar-es-salaam-stock-exchange-share-prices/",
        "EGX": "/egyptian-exchange-share-prices/",
    }

    # Custom headers to avoid blocking
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }

    def __init__(self, exchange_code: str = None):
        super().__init__()
        self.target_exchange = exchange_code
        # Update client headers
        self.client.headers.update(self.HEADERS)

    def scrape_with_playwright(self, url: str) -> Optional[str]:
        """
        Scrape page using Playwright for JavaScript-rendered content.
        Falls back to regular HTTP if Playwright is not available.
        """
        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent=self.HEADERS["User-Agent"],
                    viewport={"width": 1920, "height": 1080},
                )
                page = context.new_page()

                # Navigate and wait for content
                page.goto(url, wait_until="networkidle", timeout=30000)

                # Wait for table to load
                page.wait_for_selector("table", timeout=10000)

                html = page.content()
                browser.close()

                return html

        except ImportError:
            logger.warning("Playwright not available, falling back to HTTP request")
            return None
        except Exception as e:
            logger.error(f"Playwright scrape failed: {e}")
            return None

    def scrape_exchange(self, exchange_code: str) -> list[ScrapedTickerData]:
        """Scrape data for a specific exchange."""
        if exchange_code not in self.EXCHANGE_PAGES:
            logger.warning(f"Unknown exchange: {exchange_code}")
            return []

        url = f"{self.BASE_URL}{self.EXCHANGE_PAGES[exchange_code]}"
        logger.info(f"Scraping {exchange_code} from {url}")

        # Try Playwright first, then fall back to regular HTTP
        html_content = self.scrape_with_playwright(url)

        if html_content:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")
        else:
            # Fall back to regular HTTP request
            soup = self.fetch_page(url)

        if not soup:
            logger.error(f"Failed to fetch page for {exchange_code}")
            return []

        return self.parse_exchange_page(soup, exchange_code)

    def parse_exchange_page(self, soup: Any, exchange_code: str) -> list[ScrapedTickerData]:
        """Parse the exchange page and extract ticker data."""
        tickers = []

        # Find the main data table
        tables = soup.find_all("table")

        for table in tables:
            # Look for tables with stock data (usually have headers like Symbol, Price, etc.)
            headers = table.find_all("th")
            header_text = " ".join([h.get_text().lower() for h in headers])

            if any(keyword in header_text for keyword in ["symbol", "code", "price", "share", "stock"]):
                rows = table.find_all("tr")[1:]  # Skip header row

                for row in rows:
                    ticker = self.parse_ticker_row(row, exchange_code)
                    if ticker:
                        tickers.append(ticker)

        logger.info(f"Parsed {len(tickers)} tickers for {exchange_code}")
        return tickers

    def parse_ticker_row(self, row: Any, exchange_code: str) -> Optional[ScrapedTickerData]:
        """Parse a single row from the stock table."""
        try:
            cells = row.find_all("td")
            if len(cells) < 3:
                return None

            # Extract data based on common column structures
            # Typical structure: Symbol/Code, Name, Price, Change, Volume, etc.
            symbol = self._extract_symbol(cells)
            name = self._extract_name(cells)
            price = self._extract_price(cells)

            if not symbol or not price:
                return None

            # Extract optional fields
            change = self._extract_change(cells)
            volume = self._extract_volume(cells)
            prev_close = price - change if change else price

            return ScrapedTickerData(
                symbol=symbol,
                name=name or symbol,
                price=price,
                previous_close=prev_close,
                day_open=price,  # Often not available
                day_high=price,  # Often not available
                day_low=price,   # Often not available
                volume=volume,
                timestamp=timezone.now(),
                source=f"africanfinancials.com/{exchange_code}",
                confidence=0.9,
            )

        except Exception as e:
            logger.debug(f"Failed to parse row: {e}")
            return None

    def _extract_symbol(self, cells: list) -> Optional[str]:
        """Extract stock symbol from cells."""
        for cell in cells[:2]:  # Symbol usually in first 2 columns
            text = cell.get_text().strip().upper()
            # Symbol is usually 2-6 uppercase letters
            if re.match(r'^[A-Z]{2,6}$', text):
                return text
            # Or might have a link
            link = cell.find("a")
            if link:
                link_text = link.get_text().strip().upper()
                if re.match(r'^[A-Z]{2,6}$', link_text):
                    return link_text
        return None

    def _extract_name(self, cells: list) -> Optional[str]:
        """Extract company name from cells."""
        for cell in cells[:3]:  # Name usually in first 3 columns
            text = cell.get_text().strip()
            # Name is usually longer than symbol
            if len(text) > 6 and not re.match(r'^[\d.,\-+%$R]+$', text):
                return text
        return None

    def _extract_price(self, cells: list) -> Optional[Decimal]:
        """Extract current price from cells."""
        for cell in cells:
            text = cell.get_text().strip()
            # Remove currency symbols and formatting
            clean_text = re.sub(r'[^\d.,\-]', '', text)
            if clean_text:
                try:
                    # Handle both comma and dot as decimal separator
                    if ',' in clean_text and '.' in clean_text:
                        clean_text = clean_text.replace(',', '')
                    elif ',' in clean_text:
                        clean_text = clean_text.replace(',', '.')

                    price = Decimal(clean_text)
                    if price > 0:
                        return price
                except (ValueError, ArithmeticError):
                    continue
        return None

    def _extract_change(self, cells: list) -> Decimal:
        """Extract price change from cells."""
        for cell in cells:
            text = cell.get_text().strip()
            # Look for change values (usually have +/- or %)
            if '%' in text or (text.startswith('+') or text.startswith('-')):
                clean_text = re.sub(r'[^\d.,\-+]', '', text)
                if clean_text:
                    try:
                        return Decimal(clean_text.replace(',', '.'))
                    except (ValueError, ArithmeticError):
                        continue
        return Decimal("0")

    def _extract_volume(self, cells: list) -> int:
        """Extract trading volume from cells."""
        for cell in cells:
            text = cell.get_text().strip()
            # Volume is usually a large number
            clean_text = re.sub(r'[^\d,]', '', text)
            if clean_text:
                try:
                    volume = int(clean_text.replace(',', ''))
                    if volume >= 100:  # Reasonable minimum volume
                        return volume
                except ValueError:
                    continue
        return 0

    def scrape(self) -> list[ScrapedTickerData]:
        """
        Main scraping method.

        Scrapes specified exchange or all supported exchanges.
        """
        all_tickers = []

        if self.target_exchange:
            # Scrape specific exchange
            exchanges = [self.target_exchange]
        else:
            # Scrape all supported exchanges
            exchanges = list(self.EXCHANGE_PAGES.keys())

        for exchange_code in exchanges:
            try:
                tickers = self.scrape_exchange(exchange_code)
                all_tickers.extend(tickers)
            except Exception as e:
                logger.error(f"Failed to scrape {exchange_code}: {e}")
                continue

        return all_tickers

    def parse_ticker(self, row: Any) -> Optional[ScrapedTickerData]:
        """Parse a single ticker row (required by base class)."""
        return self.parse_ticker_row(row, self.target_exchange or "UNKNOWN")

    def save_to_database(self, data: list[ScrapedTickerData]) -> int:
        """
        Override to handle multi-exchange data.

        Groups data by exchange and saves to appropriate exchange.
        """
        from django.db import transaction
        from apps.markets.models import Company, Exchange, MarketTicker

        if not data:
            return 0

        saved_count = 0

        # Group tickers by exchange (extracted from source)
        exchange_groups = {}
        for ticker in data:
            # Extract exchange code from source (format: "africanfinancials.com/EXCHANGE")
            parts = ticker.source.split("/")
            exchange_code = parts[-1] if len(parts) > 1 else "UNKNOWN"

            if exchange_code not in exchange_groups:
                exchange_groups[exchange_code] = []
            exchange_groups[exchange_code].append(ticker)

        # Save each exchange group
        for exchange_code, tickers in exchange_groups.items():
            try:
                exchange = Exchange.objects.get(code=exchange_code)
            except Exchange.DoesNotExist:
                logger.warning(f"Exchange {exchange_code} not found, skipping {len(tickers)} tickers")
                continue

            with transaction.atomic():
                for ticker in tickers:
                    try:
                        company, created = Company.objects.update_or_create(
                            symbol=ticker.symbol,
                            exchange=exchange,
                            defaults={
                                "name": ticker.name,
                                "current_price": ticker.price,
                                "previous_close": ticker.previous_close,
                                "day_open": ticker.day_open,
                                "day_high": ticker.day_high,
                                "day_low": ticker.day_low,
                                "volume": ticker.volume,
                            },
                        )
                        saved_count += 1

                    except Exception as e:
                        logger.error(f"Failed to save {ticker.symbol}: {e}")
                        continue

        logger.info(f"Saved {saved_count}/{len(data)} tickers from African Financials")
        return saved_count


# Convenience functions for scraping specific exchanges
def scrape_vfex() -> list[ScrapedTickerData]:
    """Scrape Victoria Falls Stock Exchange data."""
    with AfricanFinancialsSpider(exchange_code="VFEX") as spider:
        return spider.scrape()


def scrape_zse() -> list[ScrapedTickerData]:
    """Scrape Zimbabwe Stock Exchange data."""
    with AfricanFinancialsSpider(exchange_code="ZSE") as spider:
        return spider.scrape()


def scrape_all_african_financials() -> list[ScrapedTickerData]:
    """Scrape all exchanges from African Financials."""
    with AfricanFinancialsSpider() as spider:
        return spider.scrape()
