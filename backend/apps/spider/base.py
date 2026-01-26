"""
Base Spider Class

Abstract base class for all market data scrapers.
Provides common functionality for data normalization and storage.
"""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any

import httpx
from bs4 import BeautifulSoup
from django.utils import timezone

logger = logging.getLogger(__name__)


@dataclass
class ScrapedTickerData:
    """Normalized ticker data structure."""

    symbol: str
    name: str
    price: Decimal
    previous_close: Decimal
    day_open: Decimal
    day_high: Decimal
    day_low: Decimal
    volume: int
    timestamp: datetime

    # Optional fields
    market_cap: Decimal | None = None
    pe_ratio: Decimal | None = None
    dividend_yield: Decimal | None = None
    week_52_high: Decimal | None = None
    week_52_low: Decimal | None = None


class BaseSpider(ABC):
    """
    Abstract base class for exchange scrapers.

    Each exchange spider should implement:
    - scrape(): Main scraping method
    - parse_ticker(): Parse individual ticker data
    - get_exchange_code(): Return exchange identifier
    """

    BASE_URL: str = ""
    EXCHANGE_CODE: str = ""
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    def __init__(self):
        self.client = httpx.Client(
            headers={"User-Agent": self.USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        )
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

    def fetch_page(self, url: str) -> BeautifulSoup | None:
        """Fetch and parse a web page."""
        try:
            response = self.client.get(url)
            response.raise_for_status()
            return BeautifulSoup(response.text, "lxml")
        except httpx.HTTPError as e:
            self.logger.error(f"Failed to fetch {url}: {e}")
            return None

    def safe_decimal(self, value: Any, default: Decimal = Decimal("0")) -> Decimal:
        """Safely convert a value to Decimal."""
        if value is None:
            return default
        try:
            # Remove common formatting characters
            if isinstance(value, str):
                value = value.strip()
                value = value.replace(",", "").replace(" ", "")
                value = value.replace("R", "").replace("$", "").replace("%", "")
                if value in ("", "-", "N/A", "n/a"):
                    return default
            return Decimal(str(value))
        except (ValueError, TypeError, ArithmeticError):
            return default

    def safe_int(self, value: Any, default: int = 0) -> int:
        """Safely convert a value to integer."""
        if value is None:
            return default
        try:
            if isinstance(value, str):
                value = value.strip()
                value = value.replace(",", "").replace(" ", "")
                if value in ("", "-", "N/A", "n/a"):
                    return default
                # Handle K/M/B suffixes
                multiplier = 1
                if value.endswith("K"):
                    multiplier = 1_000
                    value = value[:-1]
                elif value.endswith("M"):
                    multiplier = 1_000_000
                    value = value[:-1]
                elif value.endswith("B"):
                    multiplier = 1_000_000_000
                    value = value[:-1]
                return int(float(value) * multiplier)
            return int(value)
        except (ValueError, TypeError):
            return default

    @abstractmethod
    def scrape(self) -> list[ScrapedTickerData]:
        """
        Main scraping method.

        Returns a list of ScrapedTickerData objects.
        """
        pass

    @abstractmethod
    def parse_ticker(self, row: Any) -> ScrapedTickerData | None:
        """
        Parse a single ticker row.

        Returns ScrapedTickerData or None if parsing fails.
        """
        pass

    @classmethod
    def get_exchange_code(cls) -> str:
        """Return the exchange code."""
        return cls.EXCHANGE_CODE

    def save_to_database(self, data: list[ScrapedTickerData]) -> int:
        """
        Save scraped data to the database.

        Returns the number of records updated/created.
        """
        from apps.markets.models import Company, Exchange, MarketTicker

        exchange = Exchange.objects.get(code=self.EXCHANGE_CODE)
        saved_count = 0

        for ticker in data:
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
                        "market_cap": ticker.market_cap or Decimal("0"),
                        "pe_ratio": ticker.pe_ratio,
                        "dividend_yield": ticker.dividend_yield,
                        "week_52_high": ticker.week_52_high or Decimal("0"),
                        "week_52_low": ticker.week_52_low or Decimal("0"),
                    },
                )

                # Create ticker record for historical data
                MarketTicker.objects.create(
                    company=company,
                    timestamp=ticker.timestamp,
                    price=ticker.price,
                    open_price=ticker.day_open,
                    high=ticker.day_high,
                    low=ticker.day_low,
                    close=ticker.price,
                    volume=ticker.volume,
                    interval=MarketTicker.IntervalType.MINUTE_5,
                )

                saved_count += 1

            except Exception as e:
                self.logger.error(f"Failed to save {ticker.symbol}: {e}")
                continue

        self.logger.info(f"Saved {saved_count}/{len(data)} tickers for {self.EXCHANGE_CODE}")
        return saved_count
