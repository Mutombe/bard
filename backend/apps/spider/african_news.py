"""
African News Direct Scrapers

Scrapes article URLs from reliable African financial news RSS feeds
and index pages, then uses trafilatura to extract full article bodies.

Sources:
- CNBC Africa
- The Africa Report
- Business Day (South Africa)
- Moneyweb (South Africa)
- Business Daily Africa (Kenya)
- Nairametrics (Nigeria)
- African Business Magazine
- How We Made It In Africa
"""
import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from django.utils import timezone
from django.utils.text import slugify

logger = logging.getLogger(__name__)


# Reliable African financial news sources with their feed/index URLs
AFRICAN_NEWS_SOURCES = [
    {
        "name": "Moneyweb",
        "url": "https://www.moneyweb.co.za/feed/",
        "category": "markets",
    },
    {
        "name": "BusinessTech",
        "url": "https://businesstech.co.za/news/feed/",
        "category": "economy",
    },
    {
        "name": "How We Made It In Africa",
        "url": "https://www.howwemadeitinafrica.com/feed/",
        "category": "africa",
    },
    {
        "name": "Disrupt Africa",
        "url": "https://disrupt-africa.com/feed/",
        "category": "technology",
    },
    {
        "name": "TechCabal",
        "url": "https://techcabal.com/feed/",
        "category": "technology",
    },
    {
        "name": "Mail & Guardian",
        "url": "https://mg.co.za/feed/",
        "category": "africa",
    },
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def extract_body(url: str) -> Optional[str]:
    """Extract full article body using trafilatura."""
    import trafilatura
    from trafilatura.settings import use_config

    try:
        config = use_config()
        config.set("DEFAULT", "DOWNLOAD_TIMEOUT", "15")
        downloaded = trafilatura.fetch_url(url, config=config)
        if not downloaded:
            return None
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
        )
        return text
    except Exception as e:
        logger.warning(f"Body extraction failed for {url}: {e}")
        return None


def parse_rss_feed(source: dict) -> list[dict]:
    """Parse an RSS feed and return article dicts with title, url, excerpt, date."""
    articles = []
    try:
        client = httpx.Client(
            headers={"User-Agent": USER_AGENT},
            timeout=20.0,
            follow_redirects=True,
        )
        response = client.get(source["url"])
        response.raise_for_status()
        client.close()

        # Use lxml if available, otherwise html.parser
        try:
            soup = BeautifulSoup(response.text, "xml")
        except Exception:
            soup = BeautifulSoup(response.text, "html.parser")

        # RSS items
        items = soup.find_all("item")
        if not items:
            # Atom feeds
            items = soup.find_all("entry")

        for item in items[:15]:  # Max 15 per source
            title_el = item.find("title")
            link_el = item.find("link")
            desc_el = item.find("description") or item.find("summary") or item.find("content")
            pub_date_el = item.find("pubDate") or item.find("pubdate") or item.find("published") or item.find("updated")

            title = title_el.get_text(strip=True) if title_el else ""
            if not title or len(title) < 15:
                continue

            # Get link — RSS <link> is tricky with html.parser (self-closing)
            url = ""
            if link_el:
                url = link_el.get_text(strip=True) or link_el.get("href", "")
                # html.parser makes <link/> self-closing — URL is in next_sibling
                if not url and link_el.next_sibling:
                    url = str(link_el.next_sibling).strip()
            if not url:
                continue

            excerpt = ""
            if desc_el:
                # Strip HTML from description
                desc_text = desc_el.get_text(strip=True)
                # Clean CDATA
                desc_text = re.sub(r'<!\[CDATA\[|\]\]>', '', desc_text)
                excerpt = desc_text[:500]

            pub_date = pub_date_el.get_text(strip=True) if pub_date_el else ""

            articles.append({
                "title": title,
                "url": url,
                "excerpt": excerpt,
                "pub_date": pub_date,
                "source_name": source["name"],
                "category": source["category"],
            })

    except Exception as e:
        logger.warning(f"Failed to parse RSS from {source['name']}: {e}")

    return articles


def scrape_and_save_african_news() -> int:
    """
    Scrape African news from RSS feeds, extract bodies with trafilatura,
    and save to database. Only saves articles with 500+ char bodies.
    """
    from apps.news.models import NewsArticle, Category
    from apps.media.image_service import ArticleImageService
    from apps.spider.tasks import parse_article_date, is_article_fresh

    image_service = ArticleImageService()
    saved = 0
    total_fetched = 0

    for source in AFRICAN_NEWS_SOURCES:
        try:
            articles = parse_rss_feed(source)
            total_fetched += len(articles)
            logger.info(f"RSS: {source['name']} returned {len(articles)} items")

            for item in articles:
                title = item["title"][:500]

                # Filter non-finance articles from general news sources
                FINANCE_KEYWORDS = [
                    'bank', 'economy', 'finance', 'market', 'stock', 'invest',
                    'trade', 'mining', 'oil', 'gold', 'currency', 'rand', 'naira',
                    'gdp', 'inflation', 'interest rate', 'budget', 'tax', 'debt',
                    'fintech', 'crypto', 'payment', 'insurance', 'pension',
                    'infrastructure', 'energy', 'agriculture', 'export', 'import',
                    'startup', 'venture', 'fund', 'ipo', 'merger', 'acquisition',
                    'revenue', 'profit', 'billion', 'million', 'trillion',
                    'central bank', 'reserve bank', 'treasury', 'fiscal',
                    'commodity', 'petroleum', 'diesel', 'petrol', 'fuel',
                    'business', 'corporate', 'commercial', 'industrial',
                ]
                title_lower = title.lower()
                excerpt_lower = (item.get("excerpt", "") or "").lower()
                text_check = f"{title_lower} {excerpt_lower}"
                if not any(kw in text_check for kw in FINANCE_KEYWORDS):
                    continue

                # Skip if already exists
                if NewsArticle.objects.filter(title=title).exists():
                    continue
                if NewsArticle.objects.filter(external_url=item["url"][:500]).exists():
                    continue

                # Check freshness
                if not is_article_fresh(item.get("pub_date", "")):
                    continue

                # Extract full body with trafilatura
                body = extract_body(item["url"])
                if not body or len(body) < 500:
                    continue

                # Parse real date
                pub_date = parse_article_date(item.get("pub_date", "")) or timezone.now()

                # Get category
                cat_slug = item.get("category", "africa")
                category, _ = Category.objects.get_or_create(
                    slug=cat_slug,
                    defaults={"name": cat_slug.title(), "description": f"{cat_slug.title()} news"},
                )

                # Get image
                image_data = image_service.get_image_for_article(
                    title=title,
                    excerpt=item.get("excerpt", ""),
                    category_slug=cat_slug,
                    content=body[:500],
                )
                image_url = image_data.get("url", "")

                try:
                    NewsArticle.objects.create(
                        title=title,
                        excerpt=(item.get("excerpt", "") or body[:300])[:500],
                        content=body,
                        category=category,
                        status="published",
                        published_at=pub_date,
                        source="scraped",
                        external_url=item["url"][:500],
                        external_source_name=item["source_name"][:100],
                        featured_image_url=(image_url or "")[:500],
                    )
                    saved += 1
                    logger.info(f"Saved: {title[:60]} ({item['source_name']})")
                except Exception as e:
                    logger.warning(f"Failed to save '{title[:50]}': {e}")

        except Exception as e:
            logger.error(f"Source {source['name']} failed: {e}")

    logger.info(f"Direct scrape: fetched {total_fetched} items, saved {saved} with full body")
    return saved
