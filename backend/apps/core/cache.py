"""
Caching Utilities for Django REST Framework Views

Provides intelligent caching strategies for:
- List views (short TTL, invalidated on mutations)
- Detail views (medium TTL)
- Ticker/market data (very short TTL for freshness)
- Static reference data (long TTL)
"""
import functools
import hashlib
import logging
from typing import Callable, Optional

from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework.request import Request
from rest_framework.response import Response

logger = logging.getLogger(__name__)


# Cache TTLs (in seconds)
class CacheTTL:
    """Standard cache time-to-live values."""
    VERY_SHORT = 30  # 30 seconds - real-time market data
    SHORT = 60 * 2  # 2 minutes - frequently updated content
    MEDIUM = 60 * 15  # 15 minutes - standard API responses
    LONG = 60 * 60  # 1 hour - reference data
    VERY_LONG = 60 * 60 * 24  # 24 hours - static content


def get_cache_key(prefix: str, request: Request, include_user: bool = False) -> str:
    """
    Generate a unique cache key for a request.

    Args:
        prefix: Cache key prefix (e.g., 'news_list')
        request: DRF request object
        include_user: Whether to include user ID in key (for personalized responses)

    Returns:
        A unique cache key string
    """
    # Include query parameters in cache key
    query_string = request.META.get('QUERY_STRING', '')
    path = request.path

    key_parts = [prefix, path, query_string]

    if include_user and request.user.is_authenticated:
        key_parts.append(str(request.user.id))

    key_str = ":".join(key_parts)
    hash_str = hashlib.md5(key_str.encode()).hexdigest()

    return f"view_cache:{prefix}:{hash_str}"


def cache_response(
    ttl: int = CacheTTL.MEDIUM,
    key_prefix: Optional[str] = None,
    include_user: bool = False,
    cache_authenticated: bool = True,
):
    """
    Decorator for caching DRF view responses.

    Args:
        ttl: Cache time-to-live in seconds
        key_prefix: Optional prefix for cache key (defaults to view name)
        include_user: Include user ID in cache key for personalized responses
        cache_authenticated: Whether to cache responses for authenticated users

    Usage:
        @cache_response(ttl=CacheTTL.SHORT)
        def list(self, request):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @functools.wraps(view_func)
        def wrapper(self, request: Request, *args, **kwargs) -> Response:
            # Skip caching for non-GET requests
            if request.method != 'GET':
                return view_func(self, request, *args, **kwargs)

            # Optionally skip caching for authenticated users
            if not cache_authenticated and request.user.is_authenticated:
                return view_func(self, request, *args, **kwargs)

            # Generate cache key
            prefix = key_prefix or f"{self.__class__.__name__}_{view_func.__name__}"
            cache_key = get_cache_key(prefix, request, include_user)

            # Try to get cached response
            cached = cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return Response(cached)

            # Execute view and cache response
            response = view_func(self, request, *args, **kwargs)

            # Only cache successful responses
            if response.status_code == 200:
                cache.set(cache_key, response.data, ttl)
                logger.debug(f"Cache set: {cache_key} (TTL: {ttl}s)")

            return response
        return wrapper
    return decorator


def invalidate_cache(prefix: str, pattern: str = "*"):
    """
    Invalidate cached responses matching a pattern.

    Note: This requires Redis cache backend with pattern support.
    For other backends, use versioned cache keys.

    Args:
        prefix: Cache key prefix to invalidate
        pattern: Optional pattern for more specific invalidation
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")

        # Find and delete matching keys
        cache_key_pattern = f"view_cache:{prefix}:{pattern}"
        keys = redis_conn.keys(cache_key_pattern)
        if keys:
            redis_conn.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys for prefix: {prefix}")
    except ImportError:
        logger.warning("Redis not available for cache invalidation")
    except Exception as e:
        logger.error(f"Cache invalidation failed: {e}")


class CacheVersionManager:
    """
    Manages cache versions for invalidation without pattern matching.

    Use this when Redis pattern matching is not available.
    """

    VERSION_KEY_PREFIX = "cache_version"

    @classmethod
    def get_version(cls, prefix: str) -> int:
        """Get current cache version for a prefix."""
        key = f"{cls.VERSION_KEY_PREFIX}:{prefix}"
        version = cache.get(key)
        if version is None:
            version = 1
            cache.set(key, version, None)  # Never expires
        return version

    @classmethod
    def increment_version(cls, prefix: str) -> int:
        """Increment cache version, effectively invalidating all cached items."""
        key = f"{cls.VERSION_KEY_PREFIX}:{prefix}"
        try:
            return cache.incr(key)
        except ValueError:
            # Key doesn't exist, create it
            cache.set(key, 2, None)
            return 2

    @classmethod
    def get_versioned_key(cls, prefix: str, identifier: str) -> str:
        """Get a versioned cache key."""
        version = cls.get_version(prefix)
        return f"{prefix}:v{version}:{identifier}"


def versioned_cache_response(
    ttl: int = CacheTTL.MEDIUM,
    version_prefix: Optional[str] = None,
):
    """
    Decorator for caching with version-based invalidation.

    This is more portable than pattern-based invalidation and works
    with any cache backend.

    Usage:
        @versioned_cache_response(ttl=CacheTTL.SHORT, version_prefix="news")
        def list(self, request):
            ...

        # To invalidate:
        CacheVersionManager.increment_version("news")
    """
    def decorator(view_func: Callable) -> Callable:
        @functools.wraps(view_func)
        def wrapper(self, request: Request, *args, **kwargs) -> Response:
            if request.method != 'GET':
                return view_func(self, request, *args, **kwargs)

            # Generate versioned cache key
            prefix = version_prefix or self.__class__.__name__
            query_hash = hashlib.md5(
                f"{request.path}:{request.META.get('QUERY_STRING', '')}".encode()
            ).hexdigest()[:16]

            cache_key = CacheVersionManager.get_versioned_key(prefix, query_hash)

            # Try cache
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

            # Execute and cache
            response = view_func(self, request, *args, **kwargs)
            if response.status_code == 200:
                cache.set(cache_key, response.data, ttl)

            return response
        return wrapper
    return decorator


# Predefined decorators for common use cases
def cache_ticker_tape(view_func: Callable) -> Callable:
    """Cache ticker tape data (very short TTL for real-time feel)."""
    return cache_response(ttl=CacheTTL.VERY_SHORT, key_prefix="ticker_tape")(view_func)


def cache_market_list(view_func: Callable) -> Callable:
    """Cache market/stock lists (short TTL)."""
    return cache_response(ttl=CacheTTL.SHORT, key_prefix="market_list")(view_func)


def cache_news_list(view_func: Callable) -> Callable:
    """Cache news article lists (short TTL)."""
    return cache_response(ttl=CacheTTL.SHORT, key_prefix="news_list")(view_func)


def cache_reference_data(view_func: Callable) -> Callable:
    """Cache reference data like categories, exchanges (long TTL)."""
    return cache_response(ttl=CacheTTL.LONG, key_prefix="reference")(view_func)
