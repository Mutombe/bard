"""
Redis Caching Service

Provides advanced caching capabilities for:
- Complex query results
- Aggregated data
- Rate limiting counters
- Session data
"""
import hashlib
import json
import logging
from datetime import timedelta
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, Union

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheKeys:
    """Standardized cache key prefixes."""

    # Market data
    MARKET_SUMMARY = "market:summary"
    MARKET_INDICES = "market:indices"
    MARKET_GAINERS = "market:gainers"
    MARKET_LOSERS = "market:losers"
    MARKET_ACTIVE = "market:active"
    TICKER_TAPE = "market:ticker_tape"
    COMPANY_DETAIL = "market:company"

    # News
    NEWS_FEATURED = "news:featured"
    NEWS_BREAKING = "news:breaking"
    NEWS_LATEST = "news:latest"
    NEWS_BY_CATEGORY = "news:category"
    NEWS_TRENDING = "news:trending"

    # Aggregations
    AGG_DAILY_STATS = "agg:daily_stats"
    AGG_WEEKLY_SUMMARY = "agg:weekly_summary"
    AGG_SECTOR_PERFORMANCE = "agg:sector_performance"

    # User-specific
    USER_WATCHLIST = "user:watchlist"
    USER_PORTFOLIO = "user:portfolio"

    # Rate limiting
    RATE_LIMIT = "rate_limit"


class CacheTTL:
    """Standard cache TTL values in seconds."""

    REALTIME = 15  # 15 seconds - ticker tape, live prices
    SHORT = 60  # 1 minute - frequently updated data
    MEDIUM = 300  # 5 minutes - standard API responses
    LONG = 3600  # 1 hour - reference data
    VERY_LONG = 86400  # 24 hours - static data
    WEEK = 604800  # 7 days - rarely changing data


class RedisCache:
    """
    Advanced Redis caching service with pattern-based operations.
    """

    def __init__(self):
        self._cache = cache

    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a unique cache key from prefix and arguments."""
        key_parts = [prefix]

        # Add positional arguments
        for arg in args:
            key_parts.append(str(arg))

        # Add keyword arguments (sorted for consistency)
        for k, v in sorted(kwargs.items()):
            if v is not None:
                key_parts.append(f"{k}:{v}")

        key_str = ":".join(key_parts)

        # Hash long keys
        if len(key_str) > 200:
            hash_suffix = hashlib.md5(key_str.encode()).hexdigest()[:16]
            key_str = f"{prefix}:{hash_suffix}"

        return key_str

    def get(self, key: str, default: Any = None) -> Any:
        """Get a value from cache."""
        try:
            value = self._cache.get(key)
            return value if value is not None else default
        except Exception as e:
            logger.warning(f"Cache get failed for {key}: {e}")
            return default

    def set(
        self,
        key: str,
        value: Any,
        ttl: int = CacheTTL.MEDIUM,
    ) -> bool:
        """Set a value in cache."""
        try:
            self._cache.set(key, value, ttl)
            return True
        except Exception as e:
            logger.warning(f"Cache set failed for {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        try:
            self._cache.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete failed for {key}: {e}")
            return False

    def get_or_set(
        self,
        key: str,
        default_func: Callable[[], T],
        ttl: int = CacheTTL.MEDIUM,
    ) -> T:
        """Get value from cache, or compute and set if not found."""
        value = self.get(key)
        if value is not None:
            return value

        value = default_func()
        self.set(key, value, ttl)
        return value

    def increment(self, key: str, delta: int = 1) -> int:
        """Increment a counter in cache."""
        try:
            return self._cache.incr(key, delta)
        except ValueError:
            # Key doesn't exist, create it
            self._cache.set(key, delta, CacheTTL.LONG)
            return delta
        except Exception as e:
            logger.warning(f"Cache increment failed for {key}: {e}")
            return 0

    def get_many(self, keys: list) -> dict:
        """Get multiple values from cache."""
        try:
            return self._cache.get_many(keys)
        except Exception as e:
            logger.warning(f"Cache get_many failed: {e}")
            return {}

    def set_many(self, mapping: dict, ttl: int = CacheTTL.MEDIUM) -> bool:
        """Set multiple values in cache."""
        try:
            self._cache.set_many(mapping, ttl)
            return True
        except Exception as e:
            logger.warning(f"Cache set_many failed: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern (Redis only)."""
        try:
            from django_redis import get_redis_connection

            conn = get_redis_connection("default")
            keys = conn.keys(pattern)
            if keys:
                return conn.delete(*keys)
            return 0
        except ImportError:
            logger.warning("delete_pattern requires django-redis")
            return 0
        except Exception as e:
            logger.warning(f"Cache delete_pattern failed: {e}")
            return 0

    # Convenience methods for common operations

    def cache_market_summary(self, exchange: Optional[str] = None) -> dict:
        """Cache and return market summary data."""
        key = self._make_key(CacheKeys.MARKET_SUMMARY, exchange=exchange)

        def compute():
            from apps.markets.models import Company, MarketIndex

            indices = list(
                MarketIndex.objects.select_related("exchange")
                .filter(exchange__code=exchange) if exchange
                else MarketIndex.objects.select_related("exchange").all()
            )

            companies = Company.objects.filter(is_active=True)
            if exchange:
                companies = companies.filter(exchange__code=exchange)

            gainers = list(companies.order_by("-price_change_percent")[:5])
            losers = list(companies.order_by("price_change_percent")[:5])

            return {
                "indices": [
                    {
                        "code": i.code,
                        "name": i.name,
                        "value": float(i.current_value),
                        "change": float(i.change),
                        "change_percent": float(i.change_percent),
                    }
                    for i in indices
                ],
                "gainers": [
                    {"symbol": c.symbol, "name": c.name, "change_percent": c.price_change_percent}
                    for c in gainers
                ],
                "losers": [
                    {"symbol": c.symbol, "name": c.name, "change_percent": c.price_change_percent}
                    for c in losers
                ],
            }

        return self.get_or_set(key, compute, CacheTTL.SHORT)

    def cache_trending_news(self, limit: int = 10) -> list:
        """Cache and return trending news articles."""
        key = self._make_key(CacheKeys.NEWS_TRENDING, limit=limit)

        def compute():
            from apps.news.models import NewsArticle

            articles = NewsArticle.objects.filter(
                status=NewsArticle.Status.PUBLISHED
            ).select_related("category").order_by("-view_count")[:limit]

            return [
                {
                    "id": a.id,
                    "title": a.title,
                    "slug": a.slug,
                    "category": a.category.name if a.category else None,
                    "view_count": a.view_count,
                    "published_at": a.published_at.isoformat() if a.published_at else None,
                }
                for a in articles
            ]

        return self.get_or_set(key, compute, CacheTTL.MEDIUM)

    def invalidate_market_cache(self, exchange: Optional[str] = None):
        """Invalidate all market-related cache keys."""
        patterns_to_delete = [
            f"{CacheKeys.MARKET_SUMMARY}*",
            f"{CacheKeys.MARKET_INDICES}*",
            f"{CacheKeys.MARKET_GAINERS}*",
            f"{CacheKeys.MARKET_LOSERS}*",
            f"{CacheKeys.TICKER_TAPE}*",
        ]

        for pattern in patterns_to_delete:
            self.delete_pattern(pattern)

        logger.info(f"Invalidated market cache for exchange: {exchange or 'all'}")

    def invalidate_news_cache(self, category_slug: Optional[str] = None):
        """Invalidate all news-related cache keys."""
        patterns_to_delete = [
            f"{CacheKeys.NEWS_FEATURED}*",
            f"{CacheKeys.NEWS_BREAKING}*",
            f"{CacheKeys.NEWS_LATEST}*",
            f"{CacheKeys.NEWS_TRENDING}*",
        ]

        if category_slug:
            patterns_to_delete.append(f"{CacheKeys.NEWS_BY_CATEGORY}:{category_slug}*")

        for pattern in patterns_to_delete:
            self.delete_pattern(pattern)

        logger.info(f"Invalidated news cache for category: {category_slug or 'all'}")


# Decorator for caching function results
def cached(
    key_prefix: str,
    ttl: int = CacheTTL.MEDIUM,
    key_func: Optional[Callable] = None,
):
    """
    Decorator to cache function results.

    Args:
        key_prefix: Prefix for the cache key
        ttl: Cache time-to-live in seconds
        key_func: Optional function to generate cache key from arguments

    Usage:
        @cached("my_function", ttl=300)
        def my_expensive_function(arg1, arg2):
            ...
    """
    redis_cache = RedisCache()

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = redis_cache._make_key(key_prefix, *args, **kwargs)

            # Try to get from cache
            cached_value = redis_cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # Compute and cache
            result = func(*args, **kwargs)
            redis_cache.set(cache_key, result, ttl)
            logger.debug(f"Cache set: {cache_key}")

            return result

        # Add cache control methods
        wrapper.invalidate = lambda *a, **kw: redis_cache.delete(
            key_func(*a, **kw) if key_func else redis_cache._make_key(key_prefix, *a, **kw)
        )

        return wrapper

    return decorator


# Singleton instance
redis_cache = RedisCache()
