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

    # Category-specific search queries for better relevance
    CATEGORY_QUERIES = {
        "markets": "stock market trading finance",
        "economy": "economy business growth charts",
        "banking": "banking finance business",
        "technology": "fintech technology digital",
        "commodities": "gold oil commodities trading",
        "crypto": "cryptocurrency bitcoin blockchain",
        "real-estate": "real estate property investment",
        "energy": "energy oil gas renewable",
        "mining": "mining minerals resources",
        "agriculture": "agriculture farming commodities",
        "politics": "politics government policy",
        "world": "global business international",
        "africa": "africa business economy",
        "opinion": "business analysis discussion",
        "analysis": "financial analysis charts data",
        "research": "research data analytics",
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

        # Try Unsplash first - pass article_id for variety
        if use_unsplash and self.unsplash.is_configured:
            unsplash_result = self.unsplash.search_photo(
                search_query,
                article_id=article_id,
                per_page=10  # Get more results for variety
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
        Build an optimized search query for Unsplash.

        Combines:
        - Keywords from title
        - Category-specific terms
        - Finance/business context
        """
        # Extract keywords from title (most important)
        title_keywords = self._extract_keywords(title, max_keywords=3)

        # Add category context
        category_terms = self.CATEGORY_QUERIES.get(category_slug, "")

        # Build query
        query_parts = []

        # Title keywords are most important
        if title_keywords:
            query_parts.extend(title_keywords[:2])

        # Add category context
        if category_terms:
            query_parts.append(category_terms.split()[0])

        # Always include financial context for relevance
        query_parts.append("business")

        # Limit query length for better results
        query = " ".join(query_parts[:4])

        logger.debug(f"Built search query: {query}")
        return query

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
