"""
African News Scrapers

Scrapes news from African business/finance news websites:
- empowerafrica.com
- africa.businessinsider.com
- moneyandmoves.com
"""
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

import httpx
from bs4 import BeautifulSoup
from django.utils import timezone
from django.utils.text import slugify

logger = logging.getLogger(__name__)


@dataclass
class ScrapedNewsItem:
    """Normalized news item structure."""
    title: str
    excerpt: str
    content: str
    url: str
    image_url: str
    author: str
    source: str
    published_at: Optional[datetime]
    category: str
    tags: list[str]


class BaseNewsScraper:
    """Base class for news website scrapers."""

    BASE_URL: str = ""
    SOURCE_NAME: str = ""
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
            return BeautifulSoup(response.text, "html.parser")
        except httpx.HTTPError as e:
            self.logger.error(f"Failed to fetch {url}: {e}")
            return None

    def scrape(self) -> list[ScrapedNewsItem]:
        """Override in subclass to scrape news."""
        raise NotImplementedError

    def save_to_database(self, articles: list[ScrapedNewsItem]) -> int:
        """Save scraped articles to the database."""
        from apps.news.models import NewsArticle, Category

        saved_count = 0
        for item in articles:
            try:
                # Get or create category
                category, _ = Category.objects.get_or_create(
                    slug=slugify(item.category)[:50],
                    defaults={
                        "name": item.category,
                        "description": f"Articles about {item.category}",
                    }
                )

                # Generate unique slug
                base_slug = slugify(item.title)[:250]
                slug = base_slug
                counter = 1
                while NewsArticle.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                # Skip if article with similar title already exists
                if NewsArticle.objects.filter(title__iexact=item.title[:300]).exists():
                    continue

                # Create article
                article = NewsArticle.objects.create(
                    title=item.title[:300],
                    slug=slug,
                    excerpt=item.excerpt[:500] if item.excerpt else item.title[:500],
                    content=item.content or item.excerpt or item.title,
                    category=category,
                    status="published",
                    published_at=item.published_at or timezone.now(),
                    content_type="news",
                )
                saved_count += 1
                self.logger.info(f"Saved article: {item.title[:50]}...")

            except Exception as e:
                self.logger.error(f"Failed to save article '{item.title[:50]}': {e}")
                continue

        self.logger.info(f"Saved {saved_count} new articles from {self.SOURCE_NAME}")
        return saved_count


class EmpowerAfricaScraper(BaseNewsScraper):
    """Scraper for empowerafrica.com"""

    BASE_URL = "https://empowerafrica.com"
    SOURCE_NAME = "Empower Africa"

    def scrape(self) -> list[ScrapedNewsItem]:
        """Scrape latest news from Empower Africa."""
        articles = []

        # Try different common news page structures
        pages_to_try = [
            f"{self.BASE_URL}/news",
            f"{self.BASE_URL}/blog",
            f"{self.BASE_URL}/articles",
            self.BASE_URL,
        ]

        for page_url in pages_to_try:
            soup = self.fetch_page(page_url)
            if not soup:
                continue

            # Look for article elements using common patterns
            article_elements = (
                soup.select("article") or
                soup.select(".post") or
                soup.select(".news-item") or
                soup.select(".blog-post") or
                soup.select("[class*='article']")
            )

            for element in article_elements[:20]:
                article = self._parse_article(element)
                if article:
                    articles.append(article)

            if articles:
                break

        return articles

    def _parse_article(self, element: Any) -> ScrapedNewsItem | None:
        """Parse a single article element."""
        try:
            # Find title
            title_el = element.select_one("h1, h2, h3, .title, [class*='title']")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            # Find link
            link_el = element.select_one("a[href]")
            url = link_el.get("href", "") if link_el else ""
            if url and not url.startswith("http"):
                url = f"{self.BASE_URL}{url}"

            # Find excerpt
            excerpt_el = element.select_one("p, .excerpt, .summary, [class*='excerpt']")
            excerpt = excerpt_el.get_text(strip=True) if excerpt_el else ""

            # Find image
            img_el = element.select_one("img")
            image_url = img_el.get("src", "") if img_el else ""
            if image_url and not image_url.startswith("http"):
                image_url = f"{self.BASE_URL}{image_url}"

            return ScrapedNewsItem(
                title=title,
                excerpt=excerpt,
                content=excerpt,  # Will fetch full content separately if needed
                url=url,
                image_url=image_url,
                author="Empower Africa",
                source=self.SOURCE_NAME,
                published_at=timezone.now(),
                category="Africa Business",
                tags=["africa", "business", "economy"],
            )

        except Exception as e:
            self.logger.error(f"Failed to parse article: {e}")
            return None


class BusinessInsiderAfricaScraper(BaseNewsScraper):
    """Scraper for africa.businessinsider.com"""

    BASE_URL = "https://africa.businessinsider.com"
    SOURCE_NAME = "Business Insider Africa"

    def scrape(self) -> list[ScrapedNewsItem]:
        """Scrape latest news from Business Insider Africa."""
        articles = []

        pages_to_try = [
            f"{self.BASE_URL}/markets",
            f"{self.BASE_URL}/finance",
            f"{self.BASE_URL}/business",
            self.BASE_URL,
        ]

        for page_url in pages_to_try:
            soup = self.fetch_page(page_url)
            if not soup:
                continue

            # Business Insider typically uses specific classes
            article_elements = (
                soup.select("article") or
                soup.select(".tout") or
                soup.select("[class*='story']") or
                soup.select("[class*='article']")
            )

            for element in article_elements[:20]:
                article = self._parse_article(element)
                if article:
                    articles.append(article)

            if articles:
                break

        return articles

    def _parse_article(self, element: Any) -> ScrapedNewsItem | None:
        """Parse a single article element."""
        try:
            # Find title
            title_el = element.select_one("h1, h2, h3, .headline, [class*='title']")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)
            if len(title) < 10:  # Skip very short titles (likely not articles)
                return None

            # Find link
            link_el = element.select_one("a[href]")
            url = link_el.get("href", "") if link_el else ""
            if url and not url.startswith("http"):
                url = f"{self.BASE_URL}{url}"

            # Find excerpt/description
            excerpt_el = element.select_one("p, .dek, .description, [class*='summary']")
            excerpt = excerpt_el.get_text(strip=True) if excerpt_el else ""

            # Find image
            img_el = element.select_one("img")
            image_url = ""
            if img_el:
                image_url = img_el.get("src", "") or img_el.get("data-src", "")
                if image_url and not image_url.startswith("http"):
                    image_url = f"{self.BASE_URL}{image_url}"

            # Find author
            author_el = element.select_one("[class*='author'], .byline")
            author = author_el.get_text(strip=True) if author_el else "Business Insider"

            # Find category
            category_el = element.select_one("[class*='category'], .section")
            category = category_el.get_text(strip=True) if category_el else "Business"

            return ScrapedNewsItem(
                title=title,
                excerpt=excerpt,
                content=excerpt,
                url=url,
                image_url=image_url,
                author=author,
                source=self.SOURCE_NAME,
                published_at=timezone.now(),
                category=category,
                tags=["africa", "business", "markets"],
            )

        except Exception as e:
            self.logger.error(f"Failed to parse article: {e}")
            return None


class MoneyAndMovesScraper(BaseNewsScraper):
    """Scraper for moneyandmoves.com"""

    BASE_URL = "https://moneyandmoves.com"
    SOURCE_NAME = "Money and Moves"

    def scrape(self) -> list[ScrapedNewsItem]:
        """Scrape latest news from Money and Moves."""
        articles = []

        pages_to_try = [
            f"{self.BASE_URL}/news",
            f"{self.BASE_URL}/articles",
            f"{self.BASE_URL}/blog",
            self.BASE_URL,
        ]

        for page_url in pages_to_try:
            soup = self.fetch_page(page_url)
            if not soup:
                continue

            article_elements = (
                soup.select("article") or
                soup.select(".post") or
                soup.select("[class*='article']") or
                soup.select("[class*='news']")
            )

            for element in article_elements[:20]:
                article = self._parse_article(element)
                if article:
                    articles.append(article)

            if articles:
                break

        return articles

    def _parse_article(self, element: Any) -> ScrapedNewsItem | None:
        """Parse a single article element."""
        try:
            title_el = element.select_one("h1, h2, h3, .title, [class*='title']")
            if not title_el:
                return None
            title = title_el.get_text(strip=True)

            link_el = element.select_one("a[href]")
            url = link_el.get("href", "") if link_el else ""
            if url and not url.startswith("http"):
                url = f"{self.BASE_URL}{url}"

            excerpt_el = element.select_one("p, .excerpt, [class*='excerpt']")
            excerpt = excerpt_el.get_text(strip=True) if excerpt_el else ""

            img_el = element.select_one("img")
            image_url = ""
            if img_el:
                image_url = img_el.get("src", "") or img_el.get("data-src", "")
                if image_url and not image_url.startswith("http"):
                    image_url = f"{self.BASE_URL}{image_url}"

            return ScrapedNewsItem(
                title=title,
                excerpt=excerpt,
                content=excerpt,
                url=url,
                image_url=image_url,
                author="Money and Moves",
                source=self.SOURCE_NAME,
                published_at=timezone.now(),
                category="Finance",
                tags=["finance", "money", "africa"],
            )

        except Exception as e:
            self.logger.error(f"Failed to parse article: {e}")
            return None


# Aggregated scraper
class AfricanNewsScraper:
    """Aggregates news from all African news sources."""

    def __init__(self):
        self.scrapers = [
            EmpowerAfricaScraper,
            BusinessInsiderAfricaScraper,
            MoneyAndMovesScraper,
        ]
        self.logger = logging.getLogger(__name__)

    def scrape_all(self) -> list[ScrapedNewsItem]:
        """Scrape news from all configured sources."""
        all_articles = []

        for scraper_class in self.scrapers:
            try:
                with scraper_class() as scraper:
                    articles = scraper.scrape()
                    all_articles.extend(articles)
                    self.logger.info(
                        f"Scraped {len(articles)} articles from {scraper.SOURCE_NAME}"
                    )
            except Exception as e:
                self.logger.error(f"Failed to scrape {scraper_class.SOURCE_NAME}: {e}")
                continue

        # Sort by published date
        all_articles.sort(
            key=lambda x: x.published_at or timezone.now(),
            reverse=True
        )

        return all_articles

    def save_all(self) -> int:
        """Scrape and save all articles to database."""
        total_saved = 0

        for scraper_class in self.scrapers:
            try:
                with scraper_class() as scraper:
                    articles = scraper.scrape()
                    saved = scraper.save_to_database(articles)
                    total_saved += saved
            except Exception as e:
                self.logger.error(f"Failed to save from {scraper_class.SOURCE_NAME}: {e}")
                continue

        return total_saved


# Convenience functions
def scrape_african_news() -> list[ScrapedNewsItem]:
    """Scrape news from all African news sources."""
    scraper = AfricanNewsScraper()
    return scraper.scrape_all()


def scrape_and_save_african_news() -> int:
    """Scrape and save all African news to database."""
    scraper = AfricanNewsScraper()
    return scraper.save_all()
