"""
Base Spider Class

Abstract base class for all market data scrapers.
Provides common functionality for data normalization, storage,
circuit breakers, retry logic, and error handling.
"""
import logging
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from functools import wraps
from threading import Lock
from typing import Any, Callable, Optional

import httpx
from bs4 import BeautifulSoup
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)


# =========================
# Circuit Breaker Implementation
# =========================

class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern for external service calls.

    Prevents cascading failures by stopping requests to failing services.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 3,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time = None
        self._half_open_calls = 0
        self._lock = Lock()

        # Cache key for distributed state
        self._cache_key = f"circuit_breaker:{name}"

    @property
    def state(self) -> CircuitState:
        """Get current circuit state, checking for recovery."""
        with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._state = CircuitState.HALF_OPEN
                    self._half_open_calls = 0
            return self._state

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try recovery."""
        if self._last_failure_time is None:
            return True
        return (datetime.now() - self._last_failure_time).seconds >= self.recovery_timeout

    def record_success(self):
        """Record a successful call."""
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._half_open_calls += 1
                if self._half_open_calls >= self.half_open_max_calls:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    logger.info(f"Circuit breaker '{self.name}' closed after recovery")
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    def record_failure(self, error: Exception = None):
        """Record a failed call."""
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = datetime.now()

            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                logger.warning(f"Circuit breaker '{self.name}' re-opened after failed recovery")
            elif self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                logger.warning(
                    f"Circuit breaker '{self.name}' opened after {self._failure_count} failures"
                )

    def can_execute(self) -> bool:
        """Check if a call can be executed."""
        return self.state != CircuitState.OPEN


def circuit_breaker(breaker: CircuitBreaker):
    """Decorator to wrap functions with circuit breaker logic."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not breaker.can_execute():
                logger.warning(f"Circuit breaker '{breaker.name}' is open, skipping call")
                return None

            try:
                result = func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure(e)
                raise
        return wrapper
    return decorator


# =========================
# Retry Logic with Exponential Backoff
# =========================

def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    exceptions: tuple = (Exception,),
):
    """
    Decorator for retrying functions with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff calculation
        jitter: Add random jitter to prevent thundering herd
        exceptions: Tuple of exceptions to catch and retry
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_retries:
                        logger.error(
                            f"Function {func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)

                    # Add jitter to prevent thundering herd
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries + 1} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    time.sleep(delay)

            raise last_exception
        return wrapper
    return decorator


# =========================
# Rate Limiter
# =========================

class RateLimiter:
    """
    Token bucket rate limiter for API calls.
    """

    def __init__(self, calls_per_second: float = 1.0, burst: int = 5):
        self.calls_per_second = calls_per_second
        self.burst = burst
        self._tokens = burst
        self._last_update = time.time()
        self._lock = Lock()

    def acquire(self, timeout: float = 30.0) -> bool:
        """
        Acquire a token, blocking if necessary.

        Returns True if token acquired, False if timeout.
        """
        start_time = time.time()

        while True:
            with self._lock:
                # Replenish tokens based on time elapsed
                now = time.time()
                elapsed = now - self._last_update
                self._tokens = min(
                    self.burst,
                    self._tokens + elapsed * self.calls_per_second
                )
                self._last_update = now

                if self._tokens >= 1:
                    self._tokens -= 1
                    return True

            # Check timeout
            if time.time() - start_time >= timeout:
                return False

            # Wait a bit before trying again
            time.sleep(0.1)


# =========================
# Data Classes
# =========================

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
    market_cap: Optional[Decimal] = None
    pe_ratio: Optional[Decimal] = None
    dividend_yield: Optional[Decimal] = None
    week_52_high: Optional[Decimal] = None
    week_52_low: Optional[Decimal] = None

    # Metadata
    source: str = ""
    confidence: float = 1.0  # Data quality score 0-1


@dataclass
class SpiderHealth:
    """Spider health status for monitoring."""

    name: str
    last_run: Optional[datetime] = None
    last_success: Optional[datetime] = None
    last_error: Optional[str] = None
    success_count: int = 0
    error_count: int = 0
    avg_response_time: float = 0.0
    circuit_state: str = "closed"


# =========================
# Base Spider Class
# =========================

class BaseSpider(ABC):
    """
    Abstract base class for exchange scrapers.

    Each exchange spider should implement:
    - scrape(): Main scraping method
    - parse_ticker(): Parse individual ticker data
    - get_exchange_code(): Return exchange identifier

    Features:
    - Circuit breaker for fault tolerance
    - Exponential backoff retry logic
    - Rate limiting to respect API limits
    - Health monitoring and metrics
    - Graceful degradation
    """

    BASE_URL: str = ""
    EXCHANGE_CODE: str = ""
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    # Configuration
    REQUEST_TIMEOUT = 30.0
    MAX_RETRIES = 3
    RATE_LIMIT_CALLS_PER_SECOND = 2.0
    CIRCUIT_BREAKER_THRESHOLD = 5
    CIRCUIT_BREAKER_TIMEOUT = 60

    def __init__(self):
        self.client = httpx.Client(
            headers={"User-Agent": self.USER_AGENT},
            timeout=self.REQUEST_TIMEOUT,
            follow_redirects=True,
        )
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

        # Initialize circuit breaker
        self._circuit_breaker = CircuitBreaker(
            name=f"spider_{self.EXCHANGE_CODE}",
            failure_threshold=self.CIRCUIT_BREAKER_THRESHOLD,
            recovery_timeout=self.CIRCUIT_BREAKER_TIMEOUT,
        )

        # Initialize rate limiter
        self._rate_limiter = RateLimiter(
            calls_per_second=self.RATE_LIMIT_CALLS_PER_SECOND,
            burst=5,
        )

        # Health metrics
        self._health = SpiderHealth(name=self.__class__.__name__)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

    @retry_with_backoff(max_retries=3, base_delay=1.0, exceptions=(httpx.HTTPError,))
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """
        Fetch and parse a web page with retry logic.

        Features:
        - Circuit breaker protection
        - Rate limiting
        - Automatic retries with backoff
        """
        # Check circuit breaker
        if not self._circuit_breaker.can_execute():
            self.logger.warning(f"Circuit breaker open, skipping fetch for {url}")
            return None

        # Acquire rate limit token
        if not self._rate_limiter.acquire(timeout=10.0):
            self.logger.warning(f"Rate limit exceeded, skipping fetch for {url}")
            return None

        start_time = time.time()

        try:
            response = self.client.get(url)
            response.raise_for_status()

            # Record success
            self._circuit_breaker.record_success()
            self._health.success_count += 1
            self._health.last_success = datetime.now()

            # Update average response time
            response_time = time.time() - start_time
            self._health.avg_response_time = (
                (self._health.avg_response_time * 0.9) + (response_time * 0.1)
            )

            return BeautifulSoup(response.text, "html.parser")

        except httpx.HTTPError as e:
            self._circuit_breaker.record_failure(e)
            self._health.error_count += 1
            self._health.last_error = str(e)
            self.logger.error(f"Failed to fetch {url}: {e}")
            raise

    def fetch_json(self, url: str, params: dict = None) -> Optional[dict]:
        """
        Fetch JSON data with retry logic.
        """
        if not self._circuit_breaker.can_execute():
            self.logger.warning(f"Circuit breaker open, skipping fetch for {url}")
            return None

        if not self._rate_limiter.acquire(timeout=10.0):
            self.logger.warning(f"Rate limit exceeded, skipping fetch for {url}")
            return None

        try:
            response = self.client.get(url, params=params)
            response.raise_for_status()
            self._circuit_breaker.record_success()
            return response.json()
        except Exception as e:
            self._circuit_breaker.record_failure(e)
            self.logger.error(f"Failed to fetch JSON from {url}: {e}")
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
                value = value.replace("ZWL", "").replace("BWP", "").replace("KES", "")
                if value in ("", "-", "N/A", "n/a", "--"):
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
                if value in ("", "-", "N/A", "n/a", "--"):
                    return default
                # Handle K/M/B suffixes
                multiplier = 1
                if value.endswith("K") or value.endswith("k"):
                    multiplier = 1_000
                    value = value[:-1]
                elif value.endswith("M") or value.endswith("m"):
                    multiplier = 1_000_000
                    value = value[:-1]
                elif value.endswith("B") or value.endswith("b"):
                    multiplier = 1_000_000_000
                    value = value[:-1]
                return int(float(value) * multiplier)
            return int(value)
        except (ValueError, TypeError):
            return default

    def get_health(self) -> SpiderHealth:
        """Get current spider health status."""
        self._health.circuit_state = self._circuit_breaker.state.value
        return self._health

    @abstractmethod
    def scrape(self) -> list[ScrapedTickerData]:
        """
        Main scraping method.

        Returns a list of ScrapedTickerData objects.
        """
        pass

    @abstractmethod
    def parse_ticker(self, row: Any) -> Optional[ScrapedTickerData]:
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
        Save scraped data to the database using bulk operations.

        Returns the number of records updated/created.
        """
        from django.db import transaction
        from apps.markets.models import Company, Exchange, MarketTicker

        if not data:
            return 0

        try:
            exchange = Exchange.objects.get(code=self.EXCHANGE_CODE)
        except Exchange.DoesNotExist:
            self.logger.error(f"Exchange {self.EXCHANGE_CODE} not found in database")
            return 0

        saved_count = 0
        ticker_records = []

        with transaction.atomic():
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

                    # Prepare ticker record for bulk insert
                    ticker_records.append(MarketTicker(
                        company=company,
                        timestamp=ticker.timestamp,
                        price=ticker.price,
                        open_price=ticker.day_open,
                        high=ticker.day_high,
                        low=ticker.day_low,
                        close=ticker.price,
                        volume=ticker.volume,
                        interval=MarketTicker.IntervalType.MINUTE_5,
                    ))

                    saved_count += 1

                except Exception as e:
                    self.logger.error(f"Failed to save {ticker.symbol}: {e}")
                    continue

            # Bulk insert ticker records
            if ticker_records:
                MarketTicker.objects.bulk_create(
                    ticker_records,
                    ignore_conflicts=True,
                )

        self.logger.info(f"Saved {saved_count}/{len(data)} tickers for {self.EXCHANGE_CODE}")
        self._health.last_run = datetime.now()

        return saved_count

    def run(self) -> dict:
        """
        Execute the spider with full error handling.

        Returns a summary of the run.
        """
        start_time = time.time()
        result = {
            "exchange": self.EXCHANGE_CODE,
            "success": False,
            "records_saved": 0,
            "duration_seconds": 0,
            "error": None,
        }

        try:
            self.logger.info(f"Starting scrape for {self.EXCHANGE_CODE}")

            # Scrape data
            data = self.scrape()

            if data:
                # Save to database
                saved = self.save_to_database(data)
                result["records_saved"] = saved
                result["success"] = saved > 0
            else:
                self.logger.warning(f"No data scraped for {self.EXCHANGE_CODE}")

        except Exception as e:
            self.logger.error(f"Spider run failed for {self.EXCHANGE_CODE}: {e}")
            result["error"] = str(e)
            self._health.last_error = str(e)

        finally:
            result["duration_seconds"] = round(time.time() - start_time, 2)
            self.logger.info(
                f"Completed scrape for {self.EXCHANGE_CODE}: "
                f"{result['records_saved']} records in {result['duration_seconds']}s"
            )

        return result
