"""
Dynamic Image Service for Article Previews

Provides intelligent image selection for articles without featured images:
1. Searches Unsplash for relevant images based on article content
2. Falls back to category-based default images
3. Uses intelligent caching to minimize API calls
4. Ensures image variety using article-based randomization
"""
import hashlib
import logging
import random
import re
from typing import Optional

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Cache duration: 7 days for images (they don't change often)
IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60


class UnsplashService:
    """
    Service for fetching images from Unsplash API with automatic key rotation.

    Supports multiple API keys — when one is rate-limited (403), automatically
    rotates to the next key. This doubles (or more) effective rate limits.
    """

    BASE_URL = "https://api.unsplash.com"

    def __init__(self):
        self._keys = None
        self._current_key_idx = 0

    @property
    def api_keys(self) -> list[str]:
        """Lazy load all configured API keys."""
        if self._keys is None:
            self._keys = []
            for attr in ("UNSPLASH_ACCESS_KEY", "UNSPLASH_ACCESS_KEY_2", "UNSPLASH_ACCESS_KEY_3"):
                key = getattr(settings, attr, "")
                if key:
                    self._keys.append(key)
            if not self._keys:
                logger.warning("No Unsplash API keys configured")
        return self._keys

    @property
    def is_configured(self) -> bool:
        """Check if at least one Unsplash key is configured."""
        return len(self.api_keys) > 0

    def _get_current_key(self) -> str:
        """Get the current active API key."""
        if not self.api_keys:
            return ""
        return self.api_keys[self._current_key_idx % len(self.api_keys)]

    def _rotate_key(self) -> bool:
        """Rotate to the next API key. Returns True if a new key is available."""
        if len(self.api_keys) <= 1:
            return False
        old_idx = self._current_key_idx
        self._current_key_idx = (self._current_key_idx + 1) % len(self.api_keys)
        logger.info(f"Rotated Unsplash API key: {old_idx} -> {self._current_key_idx}")
        return True

    def _get_cache_key(self, query: str, orientation: str = "landscape") -> str:
        """Generate a deterministic cache key for a query."""
        key_str = f"unsplash:{query}:{orientation}"
        hash_str = hashlib.md5(key_str.encode()).hexdigest()
        return f"unsplash_image_{hash_str}"

    def search_photo(
        self,
        query: str,
        orientation: str = "landscape",
        use_cache: bool = True,
        page: int = 1,
        per_page: int = 10,
        article_id: str = None,
    ) -> Optional[dict]:
        """
        Search for photos matching the query. Auto-rotates API keys on rate limit.

        Args:
            query: Search terms (e.g., "stock market trading")
            orientation: Image orientation (landscape, portrait, squarish)
            use_cache: Whether to use cached results
            page: Page number for pagination
            per_page: Number of results per page
            article_id: Optional article ID for deterministic randomization

        Returns:
            Dict with image URLs and attribution, or None
        """
        if not self.is_configured:
            return None

        # Check cache first
        cache_key = self._get_cache_key(f"{query}:{article_id or ''}", orientation)
        if use_cache and article_id:
            cached = cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Unsplash cache hit for: {query}")
                return cached

        # Try each API key (rotate on 403)
        attempts = len(self.api_keys)
        for attempt in range(attempts):
            current_key = self._get_current_key()
            try:
                response = requests.get(
                    f"{self.BASE_URL}/search/photos",
                    params={
                        "query": query,
                        "orientation": orientation,
                        "per_page": per_page,
                        "page": page,
                        "content_filter": "high",
                    },
                    headers={
                        "Authorization": f"Client-ID {current_key}",
                        "Accept-Version": "v1",
                    },
                    timeout=10,
                )

                # Rate limited — rotate to next key and retry
                if response.status_code == 403:
                    logger.warning(f"Unsplash key {self._current_key_idx} rate limited, rotating...")
                    if self._rotate_key():
                        continue  # retry with next key
                    else:
                        logger.error("All Unsplash API keys rate limited")
                        return None

                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                if not results:
                    logger.info(f"No Unsplash results for: {query}")
                    return None

                # Filter out obviously Western/American images for African queries
                WESTERN_BLOCKLIST = [
                    'wall street', 'new york', 'manhattan', 'times square',
                    'bank of america', 'federal reserve', 'capitol hill',
                    'london city', 'canary wharf', 'tokyo', 'shanghai',
                ]
                filtered = [
                    p for p in results
                    if not any(
                        term in (p.get("alt_description", "") or "").lower()
                        or term in (p.get("description", "") or "").lower()
                        for term in WESTERN_BLOCKLIST
                    )
                ]
                # Use filtered results if any remain, otherwise use all
                pool = filtered if filtered else results

                # Pick image — deterministic if article_id provided
                if article_id:
                    seed = int(hashlib.md5(article_id.encode()).hexdigest()[:8], 16)
                    random.seed(seed)
                photo = random.choice(pool)
                if article_id:
                    random.seed()

                result = {
                    "id": photo["id"],
                    "url_raw": photo["urls"]["raw"],
                    "url_full": photo["urls"]["full"],
                    "url_regular": photo["urls"]["regular"],
                    "url_small": photo["urls"]["small"],
                    "url_thumb": photo["urls"]["thumb"],
                    "url": f"{photo['urls']['raw']}&w=800&h=450&fit=crop&auto=format",
                    "alt_description": photo.get("alt_description", ""),
                    "photographer": photo["user"]["name"],
                    "photographer_url": photo["user"]["links"]["html"],
                    "unsplash_url": photo["links"]["html"],
                    "attribution": (
                        f'Photo by <a href="{photo["user"]["links"]["html"]}?utm_source=bardiq&utm_medium=referral">'
                        f'{photo["user"]["name"]}</a> on '
                        f'<a href="https://unsplash.com/?utm_source=bardiq&utm_medium=referral">Unsplash</a>'
                    ),
                    "all_results": [
                        {
                            "id": p["id"],
                            "url": f"{p['urls']['raw']}&w=800&h=450&fit=crop&auto=format",
                            "photographer": p["user"]["name"],
                            "alt_description": p.get("alt_description", ""),
                        }
                        for p in results
                    ],
                }

                if use_cache and article_id:
                    cache.set(cache_key, result, IMAGE_CACHE_DURATION)

                return result

            except requests.exceptions.RequestException as e:
                if "403" in str(e) and self._rotate_key():
                    continue
                logger.error(f"Unsplash API request failed: {e}")
                return None
            except (KeyError, IndexError) as e:
                logger.error(f"Unsplash response parsing failed: {e}")
                return None

        return None


class ArticleImageService:
    """
    Intelligent image selection for news articles.

    Provides relevant images for articles that don't have featured images
    by analyzing article content and category.

    Tracks used URLs within a session to prevent duplicate images in the same feed.
    """

    # Class-level URL tracker — shared across all instances within a process
    # Reset with ArticleImageService.reset_session() at the start of each feed cycle
    _session_used_urls: set[str] = set()

    @classmethod
    def reset_session(cls):
        """Reset the used URL tracker. Call at the start of each feed refresh."""
        cls._session_used_urls.clear()

    def _pick_unused(self, urls: list[str], title: str) -> str | None:
        """Pick a URL from the list that hasn't been used yet in this session."""
        unused = [u for u in urls if u not in self._used_urls]
        if unused:
            picked = unused[hash(title) % len(unused)]
        elif urls:
            # All used — pick by hash anyway (better than nothing)
            picked = urls[hash(title) % len(urls)]
        else:
            return None
        self._used_urls.add(picked)
        return picked

    # Category fallback queries — short and effective
    CATEGORY_QUERIES = {
        "markets": "stock exchange",
        "economy": "economy",
        "banking": "bank",
        "technology": "technology",
        "commodities": "commodities",
        "crypto": "cryptocurrency",
        "real-estate": "real estate",
        "energy": "energy",
        "mining": "mining",
        "agriculture": "agriculture",
        "politics": "parliament",
        "world": "global business",
        "africa": "Africa city",
        "opinion": "discussion",
        "analysis": "data analytics",
        "research": "research",
        "business": "business",
    }

    # ── CURATED AFRICAN IMAGES ──
    # Hand-picked Unsplash URLs verified to show ACTUAL African scenes.
    # These bypass live Unsplash search to prevent NYC/Wall Street leakage.
    # Key = (country_keyword, subject) or just (subject) for pan-African.
    # Each entry has multiple URLs for variety.

    CURATED_AFRICAN = {
        # South Africa - verified Johannesburg/Cape Town scenes
        ("south africa", "stock exchange"): [
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # Johannesburg skyline
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=450&fit=crop",  # SA business district
            "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=450&fit=crop",  # Cape Town skyline
        ],
        ("south africa", "economy"): [
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # Johannesburg skyline
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=450&fit=crop",  # SA business
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # Joburg
        ],
        ("south africa", "bank"): [
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=450&fit=crop",  # SA financial district
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # Johannesburg CBD
        ],
        ("south africa", "infrastructure"): [
            "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&h=450&fit=crop",  # SA highway
            "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=450&fit=crop",  # Cape Town
        ],
        # Nigeria - verified Lagos scenes
        ("nigeria", "economy"): [
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos skyline
            "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&h=450&fit=crop",  # Lagos business
            "https://images.unsplash.com/photo-1572883454114-efb48e2e8cd6?w=800&h=450&fit=crop",  # Lagos aerial
        ],
        ("nigeria", "stock exchange"): [
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos skyline
            "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&h=450&fit=crop",  # Lagos business
        ],
        ("nigeria", "bank"): [
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos financial
            "https://images.unsplash.com/photo-1572883454114-efb48e2e8cd6?w=800&h=450&fit=crop",  # Lagos aerial
        ],
        # Kenya - verified Nairobi scenes
        ("kenya", "economy"): [
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi skyline
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=450&fit=crop",  # Nairobi aerial
        ],
        ("kenya", "bank"): [
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=450&fit=crop",  # Kenya business
        ],
        ("kenya", "stock exchange"): [
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi skyline
        ],
        # Pan-African (no country specified) — generic African business/finance
        (None, "stock exchange"): [
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # African business
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # African city
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
        ],
        (None, "bank"): [
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=450&fit=crop",  # SA financial
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos
        ],
        (None, "economy"): [
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # African city
            "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=450&fit=crop",  # Africa landscape
            "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=450&fit=crop",  # African skyline
        ],
        (None, "infrastructure"): [
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # African city
            "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&h=450&fit=crop",  # Road infrastructure
        ],
        # Payments / Fintech
        ("kenya", "payment"): [
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=450&fit=crop",  # Kenya
        ],
        ("kenya", "fintech"): [
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
        ],
        ("nigeria", "payment"): [
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos
            "https://images.unsplash.com/photo-1572883454114-efb48e2e8cd6?w=800&h=450&fit=crop",  # Lagos aerial
        ],
        ("nigeria", "fintech"): [
            "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&h=450&fit=crop",  # Lagos
        ],
        ("south africa", "payment"): [
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop",  # Johannesburg
        ],
        (None, "payment"): [
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",  # Mobile payment
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
        ],
        (None, "fintech"): [
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",  # Mobile payment
            "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=800&h=450&fit=crop",  # Nairobi
        ],
        # Trade
        (None, "trade"): [
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # African city
            "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=450&fit=crop",  # African skyline
        ],
        # Investment
        (None, "investment"): [
            "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=450&fit=crop",  # SA financial
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # African city
        ],
    }

    # ── SUBJECT-FIRST visual concept map ──
    # The key insight: Unsplash needs the *subject* of the photo, not the
    # *topic* of the article.  "Nigeria GDP" → bad photo.
    # "African currency notes" → great photo.
    #
    # Priority order: curated African > specific subjects > industries > broad topics
    # Country is LAST because a city skyline tells you nothing about the story.

    # Phrases checked FIRST (multi-word, most specific)
    PHRASE_VISUALS = [
        # Specific financial subjects
        ('stock exchange', 'stock exchange trading floor'),
        ('interest rate', 'central bank building'),
        ('credit rating', 'credit score finance'),
        ('real estate', 'modern building architecture'),
        ('central bank', 'central bank building'),
        ('monetary policy', 'central bank vault'),
        ('fiscal policy', 'government budget documents'),
        ('trade war', 'shipping containers port'),
        ('supply chain', 'cargo logistics warehouse'),
        ('private equity', 'boardroom meeting'),
        ('venture capital', 'startup office team'),
        ('foreign exchange', 'currency exchange rates'),
        ('bond market', 'treasury bonds finance'),
        ('commodity prices', 'commodity trading market'),
        ('food security', 'grain harvest agriculture'),
        ('climate change', 'climate environment nature'),
        ('renewable energy', 'solar panels wind farm'),
        ('electric vehicle', 'electric car charging'),
        ('digital payment', 'mobile payment fintech'),
        ('mobile money', 'mobile phone payment Africa'),
        ('stock market', 'stock market trading screen'),
        ('market cap', 'stock exchange digital'),
        ('share price', 'stock price chart screen'),
        ('economic growth', 'modern city skyline construction'),
        ('economic crisis', 'empty market recession'),
        ('debt restructuring', 'financial documents desk'),
        ('budget deficit', 'government finance papers'),
        ('trade deficit', 'shipping port containers'),
        ('current account', 'international trade shipping'),
        ('capital market', 'stock exchange floor'),
        ('money market', 'bank vault currency'),
        ('housing market', 'residential buildings aerial'),
        ('labour market', 'workers office employment'),
        ('job creation', 'construction workers building'),
        ('unemployment', 'job search newspaper'),
        ('cost of living', 'grocery shopping basket'),
        ('consumer price', 'supermarket shopping aisle'),
        ('fuel price', 'fuel pump petrol station'),
        ('oil price', 'oil barrel refinery'),
        ('gold price', 'gold bullion bars vault'),
        ('exchange rate', 'currency notes exchange'),
        ('bank recapitalisation', 'bank building modern'),
        ('financial inclusion', 'mobile banking Africa'),
        ('wealth management', 'luxury office finance'),
        ('pension fund', 'retirement savings senior'),
        ('insurance sector', 'insurance office documents'),
        ('fintech', 'smartphone app digital payment'),
        ('blockchain', 'blockchain digital network'),
        ('cryptocurrency', 'cryptocurrency bitcoin digital'),
    ]

    # Single-word subject map — matches the SUBJECT of the image, not the topic
    SUBJECT_VISUALS = {
        # Commodities → the physical thing
        'oil': 'oil refinery industrial',
        'gold': 'gold bullion bars',
        'copper': 'copper mine industrial',
        'diamond': 'diamond gemstone',
        'platinum': 'platinum metal bars',
        'coal': 'coal mine industrial',
        'iron': 'iron ore mine',
        'lithium': 'lithium battery factory',
        'cobalt': 'cobalt mining industrial',
        'uranium': 'nuclear power plant',
        'wheat': 'wheat field harvest',
        'maize': 'corn field agriculture',
        'cocoa': 'cocoa beans farm',
        'coffee': 'coffee plantation Africa',
        'cotton': 'cotton field harvest',
        'sugar': 'sugar cane plantation',
        'timber': 'timber logging forest',
        # Energy
        'solar': 'solar panels installation',
        'wind': 'wind turbines farm',
        'gas': 'natural gas pipeline',
        'hydro': 'hydroelectric dam power',
        'nuclear': 'nuclear power plant',
        # Industries → what it looks like
        'telecom': 'telecom tower antenna',
        'banking': 'modern bank building',
        'insurance': 'office meeting documents',
        'pharma': 'pharmaceutical laboratory',
        'retail': 'modern shopping mall',
        'aviation': 'airplane airport runway',
        'shipping': 'container ship port',
        'construction': 'construction crane building',
        'automobile': 'car assembly factory',
        'mining': 'open pit mine aerial',
        'agriculture': 'farm tractor field',
        'manufacturing': 'factory production line',
        'tourism': 'tourist destination Africa',
        'healthcare': 'modern hospital building',
        'education': 'university campus students',
        'airline': 'airplane airport terminal',
        'airlines': 'airplane airport terminal',
        'economy': 'modern city skyline aerial',
        'rand': 'South African currency notes',
        'naira': 'Nigerian currency money',
        'shilling': 'Kenyan currency notes',
        'cedi': 'Ghanaian currency money',
        'pound': 'Egyptian currency notes',
        'franc': 'African currency banknotes',
        'dollar': 'US dollar currency notes',
        'currency': 'currency notes exchange',
        'bank': 'modern bank building finance',
        'loan': 'bank loan documents signing',
        'profit': 'business profit chart growth',
        'revenue': 'financial report documents',
        'budget': 'government budget finance',
        'pension': 'retirement savings senior',
        'rating': 'credit rating finance documents',
        'bond': 'treasury bonds government',
        # Financial actions → visual representation
        'ipo': 'stock exchange bell ceremony',
        'merger': 'corporate handshake deal',
        'acquisition': 'corporate merger signing',
        'listing': 'stock exchange listing ceremony',
        'delisting': 'stock exchange trading floor',
        'inflation': 'price tags shopping expensive',
        'recession': 'empty business district',
        'gdp': 'modern city skyline aerial',
        'tariff': 'customs shipping containers',
        'debt': 'financial documents calculator',
        'forex': 'currency exchange booth',
        'dividend': 'money coins investment',
        'earnings': 'financial report documents',
        'crypto': 'cryptocurrency digital coins',
        'startup': 'modern startup office',
        'investor': 'stock market trading screen',
        'investors': 'stock market trading screen',
        'investment': 'financial growth chart',
        'tax': 'tax documents calculator',
        'regulation': 'government building courthouse',
        'sanctions': 'international diplomacy flags',
        'election': 'ballot box voting',
        'corruption': 'justice scales gavel',
        'privatisation': 'corporate office building',
        'privatization': 'corporate office building',
        'subsidy': 'government documents official',
        'export': 'cargo containers ship port',
        'import': 'cargo dock shipping containers',
        'drought': 'dry cracked earth drought',
        'flood': 'flooding water damage',
        'pandemic': 'hospital medical equipment',
        'poverty': 'market street developing',
        'inequality': 'contrast rich poor city',
        'infrastructure': 'road bridge construction',
        'railway': 'railway train tracks',
        'highway': 'highway road infrastructure',
        'port': 'shipping port cranes containers',
        'airport': 'modern airport terminal',
        'stadium': 'sports stadium aerial',
        'pipeline': 'pipeline construction industrial',
        'refinery': 'oil refinery industrial night',
        'smelter': 'metal smelting factory',
        'warehouse': 'warehouse logistics storage',
        'data center': 'server room data center',
    }

    # Low-priority exchange abbreviations — only used if no subject match
    EXCHANGE_FALLBACKS = {
        'jse': 'stock exchange trading floor',
        'nyse': 'wall street stock exchange',
        'nasdaq': 'stock market digital screen',
        'lse': 'London stock exchange',
        'top 40': 'stock exchange trading floor',
        'nse': 'stock exchange trading floor',
        'a2x': 'stock exchange trading floor',
    }

    # Country/region → used ONLY as modifier, never as sole query
    COUNTRY_MODIFIERS = {
        'nigeria': 'Nigeria',
        'kenya': 'Kenya',
        'south africa': 'South Africa',
        'ethiopia': 'Ethiopia',
        'ghana': 'Ghana',
        'egypt': 'Egypt',
        'morocco': 'Morocco',
        'tanzania': 'Tanzania',
        'uganda': 'Uganda',
        'zimbabwe': 'Zimbabwe',
        'botswana': 'Botswana',
        'rwanda': 'Rwanda',
        'ivory coast': 'Ivory Coast',
        'senegal': 'Senegal',
        'mozambique': 'Mozambique',
        'zambia': 'Zambia',
        'angola': 'Angola',
        'cameroon': 'Cameroon',
        'drc': 'Congo',
        'congo': 'Congo',
        'china': 'China',
        'india': 'India',
        'brazil': 'Brazil',
        'russia': 'Russia',
        'japan': 'Japan',
        'europe': 'Europe',
        'usa': 'United States',
        'uk': 'United Kingdom',
    }

    # Fallback images by category (high-quality default images) - EXPANDED for variety
    FALLBACK_IMAGES = {
        "markets": [
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=450&fit=crop",
        ],
        "economy": [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=800&h=450&fit=crop",
        ],
        "banking": [
            "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",
        ],
        "technology": [
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=450&fit=crop",
        ],
        "commodities": [
            "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop",
        ],
        "crypto": [
            "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=800&h=450&fit=crop",
        ],
        "real-estate": [
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=450&fit=crop",
        ],
        "energy": [
            "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=450&fit=crop",
        ],
        "mining": [
            "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1593340700225-1f2edae5e84f?w=800&h=450&fit=crop",
        ],
        "agriculture": [
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop",
        ],
        "business": [
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1462206092226-f46025ffe607?w=800&h=450&fit=crop",
        ],
        "africa": [
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=450&fit=crop",
        ],
        "default": [
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=450&fit=crop",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
        ],
    }

    def __init__(self):
        self.unsplash = UnsplashService()
        self._used_urls = ArticleImageService._session_used_urls

    def _extract_keywords(self, text: str, max_keywords: int = 5) -> list[str]:
        """
        Extract relevant keywords from article text.

        Uses simple frequency analysis to find important terms.
        """
        if not text:
            return []

        # Common stop words to filter out
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
            'that', 'this', 'these', 'those', 'it', 'its', 'they', 'their',
            'them', 'we', 'our', 'you', 'your', 'he', 'she', 'him', 'her', 'his',
            'who', 'what', 'when', 'where', 'why', 'how', 'which', 'while',
            'after', 'before', 'during', 'about', 'into', 'through', 'between',
            'said', 'says', 'say', 'according', 'also', 'more', 'most', 'some',
            'such', 'than', 'then', 'now', 'just', 'only', 'very', 'much',
        }

        # Clean and tokenize
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())

        # Filter and count
        word_counts = {}
        for word in words:
            if word not in stop_words:
                word_counts[word] = word_counts.get(word, 0) + 1

        # Sort by frequency and return top keywords
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        return [word for word, count in sorted_words[:max_keywords]]

    def get_image_for_article(
        self,
        title: str,
        excerpt: str = "",
        category_slug: str = "",
        content: str = "",
        article_id: str = None,
        use_unsplash: bool = True,
    ) -> dict:
        """
        Get an appropriate image for an article.

        Strategy:
        1. Extract keywords from title and excerpt
        2. Combine with category-specific terms
        3. Search Unsplash for relevant image (randomized from results)
        4. Fall back to category default if no results (randomized)

        Args:
            title: Article title
            excerpt: Article excerpt/summary
            category_slug: Category slug for fallback
            content: Full article content (optional, for keyword extraction)
            article_id: Unique article ID for deterministic image selection
            use_unsplash: Whether to use Unsplash API (disable for testing)

        Returns:
            Dict with image URL and metadata
        """
        # Generate cache key based on article details AND article_id for uniqueness
        cache_key = self._get_article_cache_key(title, f"{category_slug}:{article_id or ''}")
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # Build search query
        search_query = self._build_search_query(title, excerpt, category_slug, content)

        result = {
            "url": None,
            "attribution": None,
            "source": "fallback",
            "photographer": None,
        }

        # If curated image was selected, use it directly (no Unsplash API call)
        if search_query.startswith("__curated__"):
            curated_url = search_query.replace("__curated__", "")
            self._used_urls.add(curated_url)
            result = {
                "url": curated_url,
                "attribution": None,
                "source": "curated",
                "photographer": None,
            }
            cache.set(cache_key, result, IMAGE_CACHE_DURATION)
            return result

        # Try Unsplash — with fallback to category query if first search fails
        if use_unsplash and self.unsplash.is_configured:
            queries_to_try = [search_query]
            # Add category fallback query if the primary query is keyword-based
            cat_query = self.CATEGORY_QUERIES.get(category_slug, "")
            if cat_query and cat_query != search_query:
                queries_to_try.append(cat_query)

            for query in queries_to_try:
                unsplash_result = self.unsplash.search_photo(
                    query,
                    article_id=article_id,
                    per_page=10,
                )
                if unsplash_result and unsplash_result.get("url"):
                    # Try to pick an unused URL from results
                    chosen_url = unsplash_result["url"]
                    all_results = unsplash_result.get("all_results", [])
                    if all_results and chosen_url in self._used_urls:
                        unused = [r["url"] for r in all_results if r["url"] not in self._used_urls]
                        if unused:
                            chosen_url = unused[0]

                    self._used_urls.add(chosen_url)
                    result = {
                        "url": chosen_url,
                        "attribution": unsplash_result["attribution"],
                        "source": "unsplash",
                        "photographer": unsplash_result["photographer"],
                        "alt": unsplash_result.get("alt_description", title),
                    }
                    cache.set(cache_key, result, IMAGE_CACHE_DURATION)
                    return result

        # Fall back to category default - RANDOMIZED selection using article_id
        fallback_list = self.FALLBACK_IMAGES.get(
            category_slug,
            self.FALLBACK_IMAGES["default"]
        )

        # Use article_id as seed for deterministic but varied selection
        if article_id:
            seed = int(hashlib.md5(article_id.encode()).hexdigest()[:8], 16)
            random.seed(seed)
        fallback_url = random.choice(fallback_list)
        if article_id:
            random.seed()

        result = {
            "url": fallback_url,
            "attribution": None,
            "source": "fallback",
            "photographer": None,
            "alt": title,
        }

        cache.set(cache_key, result, IMAGE_CACHE_DURATION)
        return result

    def _get_article_cache_key(self, title: str, category_slug: str) -> str:
        """Generate a cache key for an article's image."""
        key_str = f"article_image:{title[:100]}:{category_slug}"
        hash_str = hashlib.md5(key_str.encode()).hexdigest()
        return f"article_img_{hash_str}"

    def _build_search_query(
        self,
        title: str,
        excerpt: str,
        category_slug: str,
        content: str,
    ) -> str:
        """
        Build a contextual search query for Unsplash that produces
        visually relevant HD images.

        Key insight: Unsplash needs the SUBJECT of the photo, not the
        topic of the article.  "Nigeria GDP growth" → bad results.
        "African currency notes" or "modern city skyline aerial" → great.

        Strategy (subject-first):
        1. Check for specific multi-word phrases (highest precision)
        2. Check for subject keywords (industries, commodities, actions)
        3. Use country ONLY as modifier to the subject, never alone
        4. Extract meaningful nouns from title as last resort
        5. Fall back to category visual
        """
        text = f"{title} {excerpt}".lower()

        # ── Step 0: Try curated African images FIRST ──
        # This prevents NYC/Wall Street images appearing on African stories.
        country_key = None
        for kw in self.COUNTRY_MODIFIERS:
            if kw in text:
                country_key = kw
                break

        # Check curated images for common subjects
        for subject_check in ['stock exchange', 'bank', 'economy', 'infrastructure',
                              'central bank', 'monetary policy', 'financial',
                              'payment', 'fintech', 'trade', 'investment']:
            if subject_check in text:
                # Try country-specific curated first
                if country_key:
                    curated = self.CURATED_AFRICAN.get((country_key, subject_check))
                    if curated:
                        url = self._pick_unused(curated, title)
                        if url:
                            logger.debug(f"Curated: '{title[:40]}' -> ({country_key}, {subject_check})")
                            return f"__curated__{url}"
                # Try pan-African curated
                curated = self.CURATED_AFRICAN.get((None, subject_check))
                if curated:
                    url = self._pick_unused(curated, title)
                    if url:
                        logger.debug(f"Curated (pan-African): '{title[:40]}' -> {subject_check}")
                        return f"__curated__{url}"

        # ── Step 1: Multi-word phrase matching (most precise) ──
        best_phrase = None
        for phrase, visual in self.PHRASE_VISUALS:
            if phrase in text:
                if not best_phrase or len(phrase) > len(best_phrase[0]):
                    best_phrase = (phrase, visual)

        if best_phrase:
            logger.debug(f"Phrase: '{title[:40]}' -> '{best_phrase[1]}'")
            return best_phrase[1]

        # ── Step 2: Single-word subject matching ──
        best_subject = None
        for keyword, visual in self.SUBJECT_VISUALS.items():
            if keyword in text:
                if not best_subject or len(keyword) > len(best_subject[0]):
                    best_subject = (keyword, visual)

        # ── Step 3: Find country (used as modifier only) ──
        country = None
        for keyword, name in self.COUNTRY_MODIFIERS.items():
            if keyword in text:
                if not country or len(keyword) > len(country[0]):
                    country = (keyword, name)

        # Combine: subject + country modifier → "gold bullion bars South Africa"
        if best_subject:
            query = best_subject[1]
            # Only append country if query doesn't already contain a location
            if country and country[1].lower() not in query.lower():
                query = f"{query} {country[1]}"
            logger.debug(f"Subject: '{title[:40]}' -> '{query}'")
            return query

        # ── Step 3b: Exchange abbreviations (low priority) ──
        for abbrev, visual in self.EXCHANGE_FALLBACKS.items():
            if abbrev in text:
                query = visual
                if country and country[1].lower() not in query.lower():
                    query = f"{query} {country[1]}"
                logger.debug(f"Exchange: '{title[:40]}' -> '{query}'")
                return query

        # ── Step 4: Extract meaningful nouns from title ──
        title_keywords = self._extract_keywords(title, max_keywords=5)

        generic_words = {
            'market', 'markets', 'stock', 'stocks', 'share', 'shares',
            'report', 'reports', 'news', 'update', 'updates', 'latest',
            'new', 'growth', 'rise', 'fall', 'drop', 'surge', 'rally',
            'analysis', 'outlook', 'forecast', 'review', 'global',
            'economy', 'economic', 'financial', 'sector', 'industry',
            'company', 'companies', 'firm', 'firms', 'group', 'fund',
            'billion', 'million', 'percent', 'year', 'quarter', 'annual',
            'amid', 'despite', 'public', 'first', 'next', 'today', 'all',
            'says', 'finds', 'shows', 'reveals', 'launches', 'announces',
            'navigating', 'finding', 'opportunities', 'challenges',
            'trust', 'templeton', 'management', 'investment', 'investors',
            'mid', 'cap', 'buy', 'sell', 'top', 'best', 'why', 'how',
            'trillion', 'trn', 'value', 'worth', 'total', 'high', 'low',
            'record', 'hits', 'makes', 'takes', 'gets', 'sees', 'plans',
            'seeks', 'warns', 'calls', 'moves', 'sets', 'aims', 'eyes',
            'backs', 'cuts', 'adds', 'wins', 'loses', 'holds', 'keeps',
            'remains', 'continues', 'still', 'could', 'would', 'should',
            'will', 'may', 'might', 'must', 'need', 'want', 'like',
            'south', 'north', 'east', 'west', 'african', 'africa',
            'nigerian', 'kenyan', 'egyptian', 'ghanaian', 'ethiopian',
        }
        specific = [w for w in title_keywords if w not in generic_words and len(w) > 3]

        if specific:
            # Try to build a visual query from extracted words
            query = ' '.join(specific[:3])
            # Add country context if available and query is short
            if country and len(specific) <= 2:
                query = f"{query} {country[1]}"
            logger.debug(f"Keywords: '{title[:40]}' -> '{query}'")
            return query

        # If we only have a country and nothing else, use country + category
        if country:
            cat_visual = self.CATEGORY_QUERIES.get(category_slug, 'business')
            query = f"{cat_visual} {country[1]}"
            logger.debug(f"Country+cat: '{title[:40]}' -> '{query}'")
            return query

        # ── Step 5: Category fallback ──
        category_visual = self.CATEGORY_QUERIES.get(category_slug, "African business finance")
        logger.debug(f"Category: '{title[:40]}' -> '{category_visual}'")
        return category_visual

    def get_category_image(self, category_slug: str) -> str:
        """Get a default image for a category."""
        return self.FALLBACK_IMAGES.get(
            category_slug,
            self.FALLBACK_IMAGES["default"]
        )


# Singleton instance for convenience
article_image_service = ArticleImageService()


def get_article_image(
    title: str,
    excerpt: str = "",
    category_slug: str = "",
    content: str = "",
    article_id: str = None,
) -> dict:
    """
    Convenience function to get an image for an article.

    Returns:
        Dict with 'url', 'attribution', 'source', 'photographer'
    """
    return article_image_service.get_image_for_article(
        title=title,
        excerpt=excerpt,
        category_slug=category_slug,
        content=content,
        article_id=article_id,
    )
