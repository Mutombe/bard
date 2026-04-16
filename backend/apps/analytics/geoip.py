"""
IP-based geolocation lookup using free ipapi.co service.
Caches results to avoid hitting rate limits.
"""
import logging
from typing import Optional
import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

GEO_CACHE_DURATION = 86400 * 7  # 7 days


def get_client_ip(request) -> str:
    """Extract real client IP from request headers."""
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def get_visitor_key(request) -> str:
    """
    Stable per-visitor identifier for anonymous tracking.

    Prefers the X-Visitor-Id header (client-generated UUID persisted in
    localStorage) since JWT-only apps don't carry cookies. Falls back to
    Django session key, then IP.
    """
    header_id = request.META.get("HTTP_X_VISITOR_ID", "").strip()
    if header_id:
        return header_id[:40]
    if not request.session.session_key:
        try:
            request.session.save()
        except Exception:
            pass
    return request.session.session_key or get_client_ip(request) or ""


def lookup_geo(ip: str) -> dict:
    """
    Look up geo data for an IP. Returns dict with country, country_name,
    city, region. Falls back to empty values on failure.
    """
    if not ip or ip in ("127.0.0.1", "localhost", "::1") or ip.startswith("192.168."):
        return {"country": "", "country_name": "", "city": "", "region": ""}

    cache_key = f"geo:{ip}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            f"https://ipapi.co/{ip}/json/",
            timeout=3,
            headers={"User-Agent": "BGFI/1.0"},
        )
        if response.status_code == 200:
            data = response.json()
            result = {
                "country": (data.get("country_code") or "")[:2],
                "country_name": (data.get("country_name") or "")[:80],
                "city": (data.get("city") or "")[:120],
                "region": (data.get("region") or "")[:120],
            }
            cache.set(cache_key, result, GEO_CACHE_DURATION)
            return result
    except Exception as e:
        logger.debug(f"Geo lookup failed for {ip}: {e}")

    # Cache failures briefly to avoid repeated hits
    empty = {"country": "", "country_name": "", "city": "", "region": ""}
    cache.set(cache_key, empty, 300)
    return empty


def detect_source(referrer: str) -> str:
    """Categorize traffic source from referrer."""
    if not referrer:
        return "direct"
    r = referrer.lower()
    if "google." in r or "bing." in r or "duckduckgo." in r:
        return "search"
    if "twitter.com" in r or "x.com" in r or "facebook.com" in r or "linkedin.com" in r or "instagram.com" in r:
        return "social"
    if "bgfi.global" in r or "bgfi-frontend" in r:
        return "internal"
    if "mail" in r:
        return "email"
    return "referral"
