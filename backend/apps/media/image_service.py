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
    Service for fetching images from Unsplash API.

    Unsplash provides free high-quality images with proper attribution.
    Rate limit: 50 requests/hour for demo, 5000/hour for production.
    """

    BASE_URL = "https://api.unsplash.com"

    def __init__(self):
        self._access_key = None

    @property
    def access_key(self) -> str:
        """Lazy load API key to ensure settings are fully loaded."""
        if self._access_key is None:
            self._access_key = getattr(settings, "UNSPLASH_ACCESS_KEY", "")
            if not self._access_key:
                logger.warning("Unsplash API key not configured")
        return self._access_key

    @property
    def is_configured(self) -> bool:
        """Check if Unsplash is properly configured."""
        return bool(self.access_key)

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
        Search for photos matching the query.

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

        # Check cache first - use article_id for unique caching
        cache_key = self._get_cache_key(f"{query}:{article_id or ''}", orientation)
        if use_cache and article_id:
            cached = cache.get(cache_key)
            if cached is not None:
                logger.debug(f"Unsplash cache hit for: {query}")
                return cached

        try:
            response = requests.get(
                f"{self.BASE_URL}/search/photos",
                params={
                    "query": query,
                    "orientation": orientation,
                    "per_page": per_page,
                    "page": page,
                    "content_filter": "high",  # Safe for all audiences
                },
                headers={
                    "Authorization": f"Client-ID {self.access_key}",
                    "Accept-Version": "v1",
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            results = data.get("results", [])
            if not results:
                logger.info(f"No Unsplash results for: {query}")
                return None

            # Pick a RANDOM image from results to ensure variety
            # Use article_id as seed for deterministic selection if provided
            if article_id:
                # Deterministic: same article always gets same image
                seed = int(hashlib.md5(article_id.encode()).hexdigest()[:8], 16)
                random.seed(seed)
            photo = random.choice(results)
            # Reset random state
            if article_id:
                random.seed()

            result = {
                "id": photo["id"],
                "url_raw": photo["urls"]["raw"],
                "url_full": photo["urls"]["full"],
                "url_regular": photo["urls"]["regular"],  # 1080px width
                "url_small": photo["urls"]["small"],  # 400px width
                "url_thumb": photo["urls"]["thumb"],  # 200px width
                # Recommended URL for article previews (optimized)
                "url": f"{photo['urls']['raw']}&w=800&h=450&fit=crop&auto=format",
                "alt_description": photo.get("alt_description", ""),
                "photographer": photo["user"]["name"],
                "photographer_url": photo["user"]["links"]["html"],
                "unsplash_url": photo["links"]["html"],
                # Attribution HTML for compliance
                "attribution": (
                    f'Photo by <a href="{photo["user"]["links"]["html"]}?utm_source=bardiq&utm_medium=referral">'
                    f'{photo["user"]["name"]}</a> on '
                    f'<a href="https://unsplash.com/?utm_source=bardiq&utm_medium=referral">Unsplash</a>'
                ),
                # Include all results for batch processing
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

            # Cache successful result with article-specific key
            if use_cache and article_id:
                cache.set(cache_key, result, IMAGE_CACHE_DURATION)
                logger.debug(f"Unsplash result cached for: {query} (article: {article_id})")

            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Unsplash API request failed: {e}")
            return None
        except (KeyError, IndexError) as e:
            logger.error(f"Unsplash response parsing failed: {e}")
            return None


class ArticleImageService:
    """
    Intelligent image selection for news articles.

    Provides relevant images for articles that don't have featured images
    by analyzing article content and category.
    """

    # Category-specific visual search terms for Unsplash
    CATEGORY_QUERIES = {
        "markets": "stock exchange trading floor",
        "economy": "city skyline economic growth",
        "banking": "modern bank building finance",
        "technology": "technology digital innovation",
        "commodities": "gold bars commodity trading",
        "crypto": "cryptocurrency digital finance",
        "real-estate": "modern building real estate",
        "energy": "energy power plant industrial",
        "mining": "mining mineral resources industrial",
        "agriculture": "agriculture farming harvest",
        "politics": "government parliament building",
        "world": "global business international city",
        "africa": "african city skyline modern",
        "opinion": "business meeting discussion",
        "analysis": "financial data analytics dashboard",
        "research": "research laboratory data science",
        "business": "corporate office business",
    }

    # Maps abstract financial/news terms to concrete visual concepts for Unsplash
    VISUAL_CONCEPT_MAP = {
        # Countries → landmarks / cityscapes
        'nigeria': 'Lagos Nigeria skyline',
        'kenya': 'Nairobi Kenya city',
        'south africa': 'Johannesburg South Africa skyline',
        'ethiopia': 'Addis Ababa Ethiopia modern',
        'ghana': 'Accra Ghana city',
        'egypt': 'Cairo Egypt modern city',
        'morocco': 'Casablanca Morocco city',
        'tanzania': 'Dar es Salaam Tanzania',
        'uganda': 'Kampala Uganda city',
        'zimbabwe': 'Harare Zimbabwe city',
        'botswana': 'Gaborone Botswana',
        'rwanda': 'Kigali Rwanda modern city',
        'ivory coast': 'Abidjan Ivory Coast skyline',
        'china': 'Shanghai China skyline',
        'india': 'Mumbai India financial district',
        'brazil': 'Sao Paulo Brazil skyline',
        'russia': 'Moscow Russia city',
        'japan': 'Tokyo Japan financial district',
        'europe': 'European city financial district',
        'usa': 'Wall Street New York finance',
        'uk': 'London city financial district',
        # Industries → visual representations
        'oil': 'oil refinery industrial energy',
        'gold': 'gold bars vault precious metal',
        'copper': 'copper mining industrial',
        'diamond': 'diamond mining luxury',
        'platinum': 'platinum precious metal',
        'coal': 'coal mining energy industrial',
        'iron': 'iron ore mining industrial',
        'lithium': 'lithium battery technology',
        'solar': 'solar panels renewable energy',
        'wind': 'wind farm renewable energy',
        'gas': 'natural gas pipeline energy',
        'electric': 'electric vehicle technology',
        'telecom': 'telecommunications tower network',
        'banking': 'modern bank building interior',
        'insurance': 'insurance office corporate',
        'real estate': 'modern architecture building',
        'pharma': 'pharmaceutical laboratory medicine',
        'retail': 'modern retail shopping mall',
        'aviation': 'airplane airport aviation',
        'shipping': 'container port shipping logistics',
        'construction': 'construction site crane building',
        'textile': 'textile manufacturing fashion',
        'automobile': 'automotive car manufacturing',
        'fintech': 'fintech digital payment mobile',
        # Financial concepts → visual metaphors
        'ipo': 'stock exchange bell ceremony trading',
        'merger': 'business handshake corporate deal',
        'acquisition': 'corporate merger business deal',
        'inflation': 'rising prices economics charts',
        'recession': 'economic downturn city empty',
        'gdp': 'economic growth city development',
        'interest rate': 'central bank monetary policy',
        'trade': 'international trade shipping port',
        'tariff': 'shipping containers trade port',
        'debt': 'financial documents banking',
        'bond': 'government bonds treasury finance',
        'forex': 'currency exchange global finance',
        'dividend': 'corporate profits wealth investment',
        'earnings': 'financial results corporate office',
        'crypto': 'cryptocurrency bitcoin digital',
        'blockchain': 'blockchain technology digital',
        'ai': 'artificial intelligence technology',
        'startup': 'technology startup modern office',
        'venture': 'venture capital startup office',
        'investment': 'investment portfolio wealth',
        'fund': 'investment fund management office',
        'pension': 'retirement pension elderly',
        'tax': 'tax documents finance calculator',
        'regulation': 'government regulation courthouse',
        'sanctions': 'international politics diplomacy',
        'election': 'election politics government voting',
        'corruption': 'justice courthouse gavel law',
        'reform': 'government reform policy change',
        'privatization': 'corporate takeover business',
        'subsidy': 'government aid support',
        'export': 'export shipping container port',
        'import': 'import shipping dock cargo',
        'drought': 'drought dry land agriculture',
        'flood': 'flooding disaster water',
        'pandemic': 'healthcare medical hospital',
        'climate': 'climate change environment nature',
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
                    result = {
                        "url": unsplash_result["url"],
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

        Strategy:
        1. Check title for known visual concepts (countries, industries, topics)
        2. Use concept map to translate abstract terms → visual search terms
        3. Fall back to category-specific visual query
        """
        text = f"{title} {excerpt}".lower()

        # 1. Check for matching visual concepts
        # Priority: countries first, then industries, then financial concepts
        # (longer matches are more specific so they win within each tier)
        country_match = None
        industry_match = None
        concept_match = None

        # Countries are first ~20 entries, industries next ~25, concepts after
        country_keys = [
            'nigeria', 'kenya', 'south africa', 'ethiopia', 'ghana', 'egypt',
            'morocco', 'tanzania', 'uganda', 'zimbabwe', 'botswana', 'rwanda',
            'ivory coast', 'china', 'india', 'brazil', 'russia', 'japan',
            'europe', 'usa', 'uk',
        ]
        industry_keys = [
            'oil', 'gold', 'copper', 'diamond', 'platinum', 'coal', 'iron',
            'lithium', 'solar', 'wind', 'gas', 'electric', 'telecom',
            'banking', 'insurance', 'real estate', 'pharma', 'retail',
            'aviation', 'shipping', 'construction', 'textile', 'automobile',
            'fintech',
        ]

        for concept, visual_query in self.VISUAL_CONCEPT_MAP.items():
            if concept not in text:
                continue
            if concept in country_keys:
                if not country_match or len(concept) > len(country_match[0]):
                    country_match = (concept, visual_query)
            elif concept in industry_keys:
                if not industry_match or len(concept) > len(industry_match[0]):
                    industry_match = (concept, visual_query)
            else:
                if not concept_match or len(concept) > len(concept_match[0]):
                    concept_match = (concept, visual_query)

        # Combine: country + industry is best, otherwise use whichever matched
        if country_match and industry_match:
            combined = f"{country_match[1].split()[0]} {industry_match[1]}"
            logger.debug(f"Country+industry match for '{title[:50]}': {combined}")
            return combined
        best = country_match or industry_match or concept_match
        if best:
            logger.debug(f"Visual concept match for '{title[:50]}': {best[1]}")
            return best[1]

        # 2. Extract meaningful nouns and pair with category visual context
        title_keywords = self._extract_keywords(title, max_keywords=4)

        # Words that are too generic/abstract for image search
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
        }
        specific_keywords = [w for w in title_keywords if w not in generic_words]

        # Get the category visual query as context
        category_visual = self.CATEGORY_QUERIES.get(
            category_slug, "corporate business office modern"
        )

        if specific_keywords:
            # Combine 1-2 specific keywords with the full category visual phrase
            kw_part = ' '.join(specific_keywords[:2])
            query = f"{kw_part} {category_visual}"
            # Limit to ~5 words for best Unsplash results
            query = ' '.join(query.split()[:5])
            logger.debug(f"Keyword query for '{title[:50]}': {query}")
            return query

        # 3. Fall back to category-specific visual query
        logger.debug(f"Category fallback for '{title[:50]}': {category_visual}")
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
