"""
Spider Celery Tasks

Scheduled tasks for market data scraping.
Includes integration with Polygon.io and NewsAPI.org
"""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="apps.spider.tasks.fetch_polygon_news")
def fetch_polygon_news():
    """
    Fetch financial news from Polygon.io API.

    Schedule: Every 30 minutes
    """
    from .providers import PolygonDataProvider
    from apps.news.models import NewsArticle, Category

    try:
        provider = PolygonDataProvider()
        news_items = provider.get_ticker_news(limit=20)

        # Get or create business category
        category, _ = Category.objects.get_or_create(
            slug='business',
            defaults={'name': 'Business', 'description': 'Business news'}
        )

        saved = 0
        for item in news_items:
            if not item.get('title'):
                continue

            # Check if article already exists
            if NewsArticle.objects.filter(
                title=item['title'][:500]
            ).exists():
                continue

            NewsArticle.objects.create(
                title=item['title'][:500],
                excerpt=item.get('description', '')[:500],
                content=item.get('description', ''),
                category=category,
                status='published',
                published_at=timezone.now(),
                source='polygon',
                external_url=item.get('article_url', ''),
                external_source_name=item.get('publisher', {}).get('name', 'Polygon.io'),
            )
            saved += 1

        logger.info(f"Polygon news: Fetched {len(news_items)}, saved {saved}")
        return f"Polygon: Fetched {len(news_items)}, saved {saved} articles"

    except Exception as e:
        logger.error(f"Polygon news fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.fetch_newsapi_headlines")
def fetch_newsapi_headlines():
    """
    Fetch business headlines from NewsAPI.org.

    Schedule: Every 30 minutes
    """
    from .providers import NewsAPIProvider
    from apps.news.models import NewsArticle, Category

    try:
        provider = NewsAPIProvider()
        articles = provider.get_top_headlines(category='business', page_size=20)

        # Get or create business category
        category, _ = Category.objects.get_or_create(
            slug='business',
            defaults={'name': 'Business', 'description': 'Business news'}
        )

        saved = 0
        for item in articles:
            if not item.get('title') or item.get('title') == '[Removed]':
                continue

            # Check if article already exists
            if NewsArticle.objects.filter(
                title=item['title'][:500]
            ).exists():
                continue

            # Ensure we have content
            content = item.get('content', '') or item.get('description', '') or item.get('title', '')
            if not content:
                continue

            NewsArticle.objects.create(
                title=item['title'][:500],
                excerpt=item.get('description', '')[:500] if item.get('description') else item['title'][:500],
                content=content,
                category=category,
                status='published',
                published_at=timezone.now(),
                source='newsapi',
                external_url=item.get('url', ''),
                external_source_name=item.get('source', {}).get('name', 'NewsAPI') if isinstance(item.get('source'), dict) else str(item.get('source', 'NewsAPI')),
            )
            saved += 1

        logger.info(f"NewsAPI: Fetched {len(articles)}, saved {saved}")
        return f"NewsAPI: Fetched {len(articles)}, saved {saved} articles"

    except Exception as e:
        logger.error(f"NewsAPI fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.fetch_african_news")
def fetch_african_news():
    """
    Fetch African market-specific news from NewsAPI.

    Schedule: Every hour
    """
    from .providers import NewsAPIProvider
    from apps.news.models import NewsArticle, Category

    try:
        provider = NewsAPIProvider()
        articles = provider.get_african_market_news(page_size=20)

        # Get or create markets category
        category, _ = Category.objects.get_or_create(
            slug='markets',
            defaults={'name': 'Markets', 'description': 'Market news and analysis'}
        )

        saved = 0
        for item in articles:
            if not item.get('title') or item.get('title') == '[Removed]':
                continue

            if NewsArticle.objects.filter(
                title=item['title'][:500]
            ).exists():
                continue

            NewsArticle.objects.create(
                title=item['title'][:500],
                excerpt=item.get('description', '')[:500] if item.get('description') else '',
                content=item.get('content', '') or item.get('description', ''),
                category=category,
                status='published',
                published_at=timezone.now(),
                source='newsapi',
                external_url=item.get('url', ''),
                external_source_name=item.get('source', {}).get('name', 'African News') if isinstance(item.get('source'), dict) else str(item.get('source', 'African News')),
            )
            saved += 1

        logger.info(f"African news: Fetched {len(articles)}, saved {saved}")
        return f"African news: Fetched {len(articles)}, saved {saved} articles"

    except Exception as e:
        logger.error(f"African news fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.fetch_polygon_indices")
def fetch_polygon_indices():
    """
    Fetch market indices from Polygon.io.

    Schedule: Every 15 minutes during market hours
    """
    from decimal import Decimal
    from .providers import PolygonDataProvider
    from apps.markets.models import MarketIndex, Exchange

    try:
        provider = PolygonDataProvider()
        indices = provider.get_indices(limit=50)

        # Default to JSE exchange for indices
        jse = Exchange.objects.filter(code='JSE').first()

        saved = 0
        for idx in indices:
            if not idx.get('symbol'):
                continue

            # Get price data
            price_data = provider.get_previous_close(idx['symbol'])

            if price_data:
                MarketIndex.objects.update_or_create(
                    code=idx['symbol'][:20],
                    defaults={
                        'name': idx.get('name', idx['symbol'])[:200],
                        'exchange': jse,
                        'current_value': price_data.get('close', Decimal('0')),
                        'previous_close': price_data.get('open', Decimal('0')),
                        'day_high': price_data.get('high', Decimal('0')),
                        'day_low': price_data.get('low', Decimal('0')),
                    }
                )
                saved += 1

        logger.info(f"Polygon indices: Fetched {len(indices)}, saved {saved}")
        return f"Indices: Fetched {len(indices)}, saved {saved}"

    except Exception as e:
        logger.error(f"Polygon indices fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.scrape_jse_data")
def scrape_jse_data():
    """
    Scrape JSE (Johannesburg Stock Exchange) data.

    Schedule: Every 5 minutes, 08:00-17:00 Mon-Fri
    """
    from .spiders import JSESpider

    try:
        with JSESpider() as spider:
            data = spider.scrape()
            saved = spider.save_to_database(data)
            return f"JSE: Scraped {len(data)}, saved {saved} tickers"
    except Exception as e:
        logger.error(f"JSE scraping failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.scrape_zse_data")
def scrape_zse_data():
    """
    Scrape ZSE (Zimbabwe Stock Exchange) data.

    Schedule: Every 10 minutes, 08:00-16:00 Mon-Fri
    """
    from .spiders import ZSESpider

    try:
        with ZSESpider() as spider:
            data = spider.scrape()
            saved = spider.save_to_database(data)
            return f"ZSE: Scraped {len(data)}, saved {saved} tickers"
    except Exception as e:
        logger.error(f"ZSE scraping failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.scrape_bse_data")
def scrape_bse_data():
    """
    Scrape BSE (Botswana Stock Exchange) data.

    Schedule: Every 10 minutes, 09:00-16:00 Mon-Fri
    """
    from .spiders import BSESpider

    try:
        with BSESpider() as spider:
            data = spider.scrape()
            saved = spider.save_to_database(data)
            return f"BSE: Scraped {len(data)}, saved {saved} tickers"
    except Exception as e:
        logger.error(f"BSE scraping failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.scrape_african_financials")
def scrape_african_financials(exchange_code: str = None):
    """
    Scrape market data from africanfinancials.com.

    Supports multiple exchanges:
    - VFEX (Victoria Falls Stock Exchange) - USD
    - ZSE (Zimbabwe Stock Exchange) - ZIG
    - JSE, BSE, NSE, GSE, etc.

    Args:
        exchange_code: Specific exchange to scrape, or None for all

    Schedule: Every 30 minutes during trading hours
    """
    from .spiders.african_financials import AfricanFinancialsSpider

    try:
        with AfricanFinancialsSpider(exchange_code=exchange_code) as spider:
            data = spider.scrape()
            if data:
                saved = spider.save_to_database(data)
                return f"African Financials: Scraped {len(data)}, saved {saved} tickers"
            return "African Financials: No data scraped"

    except Exception as e:
        logger.error(f"African Financials scraping failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.scrape_vfex_data")
def scrape_vfex_data():
    """
    Scrape Victoria Falls Stock Exchange (VFEX) data.
    Trading currency: USD

    Schedule: Every 15 minutes, 08:00-16:00 Mon-Fri
    """
    return scrape_african_financials(exchange_code="VFEX")


@shared_task(name="apps.spider.tasks.aggregate_daily_data")
def aggregate_daily_data():
    """
    Aggregate intraday data into daily OHLCV records.

    Schedule: 18:00 daily (after market close)
    """
    from django.db.models import Avg, Max, Min, Sum

    from apps.markets.models import Company, MarketTicker

    today = timezone.now().date()

    companies = Company.objects.filter(is_active=True)
    aggregated = 0

    for company in companies:
        # Get all intraday tickers for today
        intraday = MarketTicker.objects.filter(
            company=company,
            timestamp__date=today,
            interval__in=[
                MarketTicker.IntervalType.TICK,
                MarketTicker.IntervalType.MINUTE_1,
                MarketTicker.IntervalType.MINUTE_5,
            ],
        )

        if not intraday.exists():
            continue

        # Aggregate into daily record
        agg_data = intraday.aggregate(
            open_price=Min("timestamp"),
            high=Max("high"),
            low=Min("low"),
            total_volume=Sum("volume"),
            avg_price=Avg("price"),
        )

        # Get first and last prices
        first_ticker = intraday.order_by("timestamp").first()
        last_ticker = intraday.order_by("-timestamp").first()

        if first_ticker and last_ticker:
            MarketTicker.objects.update_or_create(
                company=company,
                timestamp=timezone.make_aware(
                    timezone.datetime.combine(today, timezone.datetime.min.time())
                ),
                interval=MarketTicker.IntervalType.DAY,
                defaults={
                    "price": last_ticker.price,
                    "open_price": first_ticker.price,
                    "high": agg_data["high"],
                    "low": agg_data["low"],
                    "close": last_ticker.price,
                    "volume": agg_data["total_volume"] or 0,
                },
            )
            aggregated += 1

    logger.info(f"Aggregated daily data for {aggregated} companies")
    return f"Aggregated {aggregated} daily records"


@shared_task(name="apps.spider.tasks.calculate_indices")
def calculate_indices():
    """
    Calculate and update market indices.

    Schedule: Every 15 minutes during market hours
    """
    from decimal import Decimal

    from django.db.models import Avg, Sum

    from apps.markets.models import Company, Exchange, MarketIndex

    updated = 0

    for exchange in Exchange.objects.filter(is_active=True):
        # Get all active companies for this exchange
        companies = Company.objects.filter(
            exchange=exchange,
            is_active=True,
        )

        if not companies.exists():
            continue

        # Calculate simple index (market-cap weighted average)
        total_market_cap = sum(c.market_cap for c in companies if c.market_cap)

        if total_market_cap > 0:
            weighted_price = sum(
                (c.current_price * c.market_cap / total_market_cap)
                for c in companies
                if c.market_cap
            )

            # Update or create the main index
            index_code = f"{exchange.code}_ALL"
            index, created = MarketIndex.objects.update_or_create(
                code=index_code,
                defaults={
                    "name": f"{exchange.name} All Share Index",
                    "exchange": exchange,
                    "current_value": weighted_price,
                },
            )

            # Calculate YTD change if we have historical data
            # (simplified - would need proper historical baseline)

            updated += 1

    logger.info(f"Updated {updated} market indices")
    return f"Updated {updated} indices"


@shared_task(name="apps.spider.tasks.scrape_african_news_websites")
def scrape_african_news_websites():
    """
    Scrape news from African business/finance websites:
    - empowerafrica.com
    - africa.businessinsider.com
    - moneyandmoves.com

    Schedule: Every 2 hours
    """
    from .african_news import scrape_and_save_african_news

    try:
        saved = scrape_and_save_african_news()
        logger.info(f"African news websites: Saved {saved} articles")
        return f"African news websites: Saved {saved} articles"
    except Exception as e:
        logger.error(f"African news website scraping failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.cleanup_old_data")
def cleanup_old_data():
    """
    Clean up old intraday ticker data.

    Keeps:
    - All daily/weekly/monthly data
    - Last 7 days of intraday data
    - Last 30 days of 5-minute data

    Schedule: 02:00 daily
    """
    from datetime import timedelta

    from apps.markets.models import MarketTicker

    now = timezone.now()

    # Delete tick data older than 7 days
    tick_cutoff = now - timedelta(days=7)
    deleted_ticks = MarketTicker.objects.filter(
        interval=MarketTicker.IntervalType.TICK,
        timestamp__lt=tick_cutoff,
    ).delete()[0]

    # Delete 1-minute data older than 7 days
    deleted_1m = MarketTicker.objects.filter(
        interval=MarketTicker.IntervalType.MINUTE_1,
        timestamp__lt=tick_cutoff,
    ).delete()[0]

    # Delete 5-minute data older than 30 days
    minute_cutoff = now - timedelta(days=30)
    deleted_5m = MarketTicker.objects.filter(
        interval=MarketTicker.IntervalType.MINUTE_5,
        timestamp__lt=minute_cutoff,
    ).delete()[0]

    total_deleted = deleted_ticks + deleted_1m + deleted_5m
    logger.info(f"Cleanup: Deleted {total_deleted} old ticker records")

    return f"Deleted {total_deleted} old records"


@shared_task(name="apps.spider.tasks.fetch_youtube_african_finance")
def fetch_youtube_african_finance():
    """
    Fetch YouTube videos about African finance, economics, and markets
    using the YouTube Data API v3.

    Searches multiple African regions for comprehensive coverage.
    Schedule: Every 4 hours
    """
    from django.utils.text import slugify
    from apps.media.models import Video, VideoCategory
    from apps.media.services import youtube_service

    try:
        # Get or create category
        category, _ = VideoCategory.objects.get_or_create(
            slug='african-finance',
            defaults={
                'name': 'African Finance',
                'description': 'Videos about African finance, economics, and markets'
            }
        )

        saved = 0
        all_videos = []

        # Search multiple regions for variety
        regions = ['africa', 'south_africa', 'nigeria', 'kenya', 'egypt', 'zimbabwe']

        for region in regions:
            try:
                videos = youtube_service.search_finance_videos(region=region, max_results=5)
                all_videos.extend(videos)
                logger.info(f"Fetched {len(videos)} videos for region: {region}")
            except Exception as e:
                logger.warning(f"Failed to fetch videos for {region}: {e}")
                continue

        # Remove duplicates based on video_id
        seen_ids = set()
        unique_videos = []
        for video in all_videos:
            if video['video_id'] not in seen_ids:
                seen_ids.add(video['video_id'])
                unique_videos.append(video)

        logger.info(f"Total unique videos fetched: {len(unique_videos)}")

        for video_data in unique_videos:
            video_id = video_data.get('video_id')
            if not video_id:
                continue

            # Skip if already exists
            if Video.objects.filter(video_id=video_id).exists():
                continue

            title = video_data.get('title', '')[:255]
            if not title:
                continue

            # Generate unique slug
            base_slug = slugify(title)[:200]
            slug = base_slug
            counter = 1
            while Video.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            Video.objects.create(
                title=title,
                slug=slug,
                description=video_data.get('description', '')[:2000],
                platform='youtube',
                video_id=video_id,
                video_url=video_data.get('video_url', f'https://www.youtube.com/watch?v={video_id}'),
                embed_url=video_data.get('embed_url', f'https://www.youtube.com/embed/{video_id}'),
                thumbnail_url=video_data.get('thumbnail_url', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
                channel_id=video_data.get('channel_id', ''),
                channel_title=video_data.get('channel_title', '')[:255],
                duration=video_data.get('duration_formatted', ''),
                view_count=video_data.get('view_count', 0),
                published_at=video_data.get('published_at'),
                category=category,
                status='published',
                tags=['africa', 'finance', 'markets', 'economy'],
            )
            saved += 1
            logger.info(f"Saved video: {title[:50]}...")

        logger.info(f"YouTube African finance: Saved {saved} videos")
        return f"YouTube: Fetched {len(unique_videos)}, saved {saved} new videos"

    except Exception as e:
        logger.error(f"YouTube fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.set_article_images")
def set_article_images():
    """
    Set external image URLs for articles without images.

    Uses Unsplash API for high-quality, relevant stock images based on article content.
    Each article gets a unique image that's stored permanently in the database.
    Prioritizes featured articles.
    Schedule: Every hour
    """
    from apps.news.models import NewsArticle
    from apps.media.image_service import UnsplashService
    import hashlib

    try:
        # Get articles without images (both local and URL), prioritize featured
        articles = NewsArticle.objects.filter(
            featured_image='',
            featured_image_url='',
            status='published',
        ).order_by('-is_featured', '-published_at')[:30]

        if not articles.exists():
            return "No articles need images"

        unsplash = UnsplashService()
        saved = 0

        # Fallback images for when API is unavailable or rate limited
        # EXPANDED diverse set covering finance, business, markets, technology, Africa
        fallback_images = [
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop",  # Stock market 1
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop",  # Trading
            "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop",  # Finance
            "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&h=450&fit=crop",  # Charts
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",  # Business 1
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop",  # News
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop",  # Businessman
            "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",  # Africa business
            "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=800&h=450&fit=crop",  # Coins/Money
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop",  # Calculator
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",  # Tech 1
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",  # Dashboard
            "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=450&fit=crop",  # City skyline 1
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop",  # Office building
            "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&h=450&fit=crop",  # Growth chart
            "https://images.unsplash.com/photo-1462206092226-f46025ffe607?w=800&h=450&fit=crop",  # World map
            "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=800&h=450&fit=crop",  # Oil/Energy
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop",  # Mining
            "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop",  # Bank building
            "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop",  # Handshake deal
            # Additional variety images
            "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&h=450&fit=crop",  # Stock market 2
            "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=450&fit=crop",  # Trading 2
            "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=800&h=450&fit=crop",  # Economy charts
            "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&h=450&fit=crop",  # Banking 2
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",  # Banking 3
            "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop",  # Tech 2
            "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=450&fit=crop",  # Tech 3
            "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=450&fit=crop",  # Africa 2
            "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=450&fit=crop",  # Africa 3
            "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=450&fit=crop",  # Energy 2
            "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=450&fit=crop",  # Solar energy
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=450&fit=crop",  # Real estate
            "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=450&fit=crop",  # Agriculture
            "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop",  # Agriculture 2
            "https://images.unsplash.com/photo-1593340700225-1f2edae5e84f?w=800&h=450&fit=crop",  # Mining 2
            "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&h=450&fit=crop",  # Crypto
            "https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=800&h=450&fit=crop",  # Crypto 2
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=450&fit=crop",  # City skyline 2
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=450&fit=crop",  # City business 2
            "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=450&fit=crop",  # Business 2
        ]

        for article in articles:
            try:
                image_url = None

                # Try Unsplash API first for relevant images
                if unsplash.is_configured:
                    # Build search query from title keywords
                    title_words = article.title.lower().split()
                    # Remove common words
                    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
                    keywords = [w for w in title_words if w not in stop_words and len(w) > 2][:3]

                    # Add business context
                    search_query = ' '.join(keywords) + ' business' if keywords else 'business finance'

                    # Get multiple results and pick one based on article ID for uniqueness
                    result = unsplash.search_photo(search_query, per_page=10, use_cache=False)

                    if result and result.get('all_results'):
                        # Use article ID hash to select a consistent but varied image
                        article_hash = int(hashlib.md5(str(article.id).encode()).hexdigest(), 16)
                        index = article_hash % len(result['all_results'])
                        selected = result['all_results'][index]
                        image_url = selected.get('url')
                        logger.info(f"Unsplash image for '{article.title[:30]}...': {search_query}")

                # Fallback to curated images if no API result
                if not image_url:
                    # Use article ID hash to select from fallback images for consistency
                    article_hash = int(hashlib.md5(str(article.id).encode()).hexdigest(), 16)
                    index = article_hash % len(fallback_images)
                    image_url = fallback_images[index]
                    logger.info(f"Fallback image for: {article.title[:50]}...")

                article.featured_image_url = image_url
                article.save(update_fields=['featured_image_url'])
                saved += 1

            except Exception as e:
                logger.error(f"Failed to set image for article {article.id}: {e}")
                continue

        logger.info(f"Set image URLs for {saved} articles")
        return f"Set {saved} article image URLs"

    except Exception as e:
        logger.error(f"Set article images failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.set_featured_article")
def set_featured_article():
    """
    Ensure there's always a featured article with an image.

    Picks the most recent published article with an image and marks it as featured.
    Schedule: Every 2 hours
    """
    from apps.news.models import NewsArticle

    try:
        # Check if there's already a featured article with an image
        current_featured = NewsArticle.objects.filter(
            is_featured=True,
            status='published',
        ).exclude(featured_image='').first()

        if current_featured:
            return f"Current featured article: {current_featured.title[:50]}"

        # Find the best candidate - recent article with image
        candidate = NewsArticle.objects.filter(
            status='published',
        ).exclude(
            featured_image=''
        ).order_by('-published_at').first()

        if candidate:
            # Unfeature all other articles
            NewsArticle.objects.filter(is_featured=True).update(is_featured=False)

            # Feature the candidate
            candidate.is_featured = True
            candidate.save(update_fields=['is_featured'])

            logger.info(f"Set featured article: {candidate.title}")
            return f"Featured: {candidate.title[:50]}"

        # If no article with image, just feature the most recent one
        recent = NewsArticle.objects.filter(
            status='published'
        ).order_by('-published_at').first()

        if recent:
            NewsArticle.objects.filter(is_featured=True).update(is_featured=False)
            recent.is_featured = True
            recent.save(update_fields=['is_featured'])
            logger.info(f"Set featured article (no image): {recent.title}")
            return f"Featured (no image): {recent.title[:50]}"

        return "No articles to feature"

    except Exception as e:
        logger.error(f"Set featured article failed: {e}")
        raise


# =========================
# CNBC Africa Video Integration
# =========================
# CNBC Africa YouTube Channel: https://www.youtube.com/@Cnbcafrica410
# Channel ID: UCqXiCKq3jLqR-i_tCODQSow (CNBC Africa)
CNBC_AFRICA_CHANNEL_ID = "UCsba91UGiQLFOb5DN3Z_AdQ"


@shared_task(name="apps.spider.tasks.fetch_cnbc_africa_video")
def fetch_cnbc_africa_video():
    """
    Fetch the latest video from CNBC Africa YouTube channel.

    This video is featured in the news feed and changes every 12 hours.
    Schedule: Every 12 hours
    """
    from django.utils.text import slugify
    from apps.media.models import Video, VideoCategory
    from apps.media.services import youtube_service

    try:
        # Get or create CNBC Africa category
        category, _ = VideoCategory.objects.get_or_create(
            slug='cnbc-africa',
            defaults={
                'name': 'CNBC Africa',
                'description': 'Latest videos from CNBC Africa - African business news'
            }
        )

        # Fetch recent videos from CNBC Africa channel
        videos = youtube_service.get_channel_videos(
            channel_id=CNBC_AFRICA_CHANNEL_ID,
            max_results=5,
        )

        if not videos:
            # Fallback: search for CNBC Africa videos
            videos = youtube_service.search_videos(
                query="CNBC Africa",
                max_results=5,
                order="date",
                channel_id=CNBC_AFRICA_CHANNEL_ID,
            )

        if not videos:
            logger.warning("No CNBC Africa videos found")
            return "No videos found"

        # Get the most recent video
        latest_video = videos[0]
        video_id = latest_video.get('video_id')

        if not video_id:
            return "No valid video ID"

        # Check if this video already exists
        existing = Video.objects.filter(video_id=video_id).first()

        if existing:
            # Update to featured if not already
            if not existing.is_featured:
                # Unfeature other CNBC Africa videos
                Video.objects.filter(
                    category=category,
                    is_featured=True
                ).update(is_featured=False)

                existing.is_featured = True
                existing.save(update_fields=['is_featured'])
                logger.info(f"Set featured CNBC video: {existing.title}")
                return f"Featured existing: {existing.title[:50]}"
            return f"Already featured: {existing.title[:50]}"

        # Create new video entry
        title = latest_video.get('title', '')[:255]
        base_slug = slugify(title)[:200]
        slug = base_slug
        counter = 1
        while Video.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Unfeature other CNBC Africa videos
        Video.objects.filter(
            category=category,
            is_featured=True
        ).update(is_featured=False)

        video = Video.objects.create(
            title=title,
            slug=slug,
            description=latest_video.get('description', '')[:2000],
            platform='youtube',
            video_id=video_id,
            video_url=latest_video.get('video_url', f'https://www.youtube.com/watch?v={video_id}'),
            embed_url=latest_video.get('embed_url', f'https://www.youtube.com/embed/{video_id}'),
            thumbnail_url=latest_video.get('thumbnail_url', ''),
            channel_id=CNBC_AFRICA_CHANNEL_ID,
            channel_title='CNBC Africa',
            duration=latest_video.get('duration_formatted', ''),
            duration_seconds=latest_video.get('duration_seconds', 0),
            view_count=latest_video.get('view_count', 0),
            published_at=latest_video.get('published_at'),
            category=category,
            status='published',
            is_featured=True,
            tags=['cnbc', 'africa', 'finance', 'business', 'markets'],
        )

        logger.info(f"Added featured CNBC Africa video: {video.title}")
        return f"Added: {video.title[:50]}"

    except Exception as e:
        logger.error(f"CNBC Africa video fetch failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.get_featured_video")
def get_featured_video():
    """
    Get the current featured CNBC Africa video for the feed.
    Returns the video data for embedding in the news feed.
    """
    from apps.media.models import Video

    try:
        featured = Video.objects.filter(
            channel_id=CNBC_AFRICA_CHANNEL_ID,
            status='published',
            is_featured=True,
        ).first()

        if not featured:
            # Get most recent CNBC Africa video
            featured = Video.objects.filter(
                channel_id=CNBC_AFRICA_CHANNEL_ID,
                status='published',
            ).order_by('-published_at').first()

        if featured:
            return {
                'id': str(featured.id),
                'title': featured.title,
                'video_id': featured.video_id,
                'embed_url': featured.get_embed_url(),
                'thumbnail_url': featured.thumbnail_url,
                'duration': featured.duration,
                'channel_title': featured.channel_title,
                'published_at': featured.published_at.isoformat() if featured.published_at else None,
            }

        return None

    except Exception as e:
        logger.error(f"Get featured video failed: {e}")
        return None


@shared_task(name="apps.spider.tasks.refresh_feed_content")
def refresh_feed_content():
    """
    Master task to refresh all feed content (Bloomberg-style).

    Runs every 30 minutes to keep content fresh:
    - Fetches new news from all sources
    - Updates article images
    - Sets featured articles
    - Updates CNBC Africa video every 12 hours

    Schedule: Every 30 minutes
    """
    from datetime import timedelta
    from apps.media.models import Video

    results = []

    # 1. Fetch news from all sources
    try:
        results.append(fetch_polygon_news())
    except Exception as e:
        results.append(f"Polygon failed: {e}")

    try:
        results.append(fetch_newsapi_headlines())
    except Exception as e:
        results.append(f"NewsAPI failed: {e}")

    try:
        results.append(fetch_african_news())
    except Exception as e:
        results.append(f"African news failed: {e}")

    # 2. Set article images
    try:
        results.append(set_article_images())
    except Exception as e:
        results.append(f"Images failed: {e}")

    # 3. Set featured article
    try:
        results.append(set_featured_article())
    except Exception as e:
        results.append(f"Featured failed: {e}")

    # 4. Check if CNBC video needs refresh (every 12 hours)
    try:
        last_cnbc_video = Video.objects.filter(
            channel_id=CNBC_AFRICA_CHANNEL_ID,
            status='published',
        ).order_by('-created_at').first()

        needs_refresh = (
            not last_cnbc_video or
            timezone.now() - last_cnbc_video.created_at > timedelta(hours=12)
        )

        if needs_refresh:
            results.append(fetch_cnbc_africa_video())
        else:
            results.append("CNBC video still fresh")
    except Exception as e:
        results.append(f"CNBC video failed: {e}")

    logger.info(f"Feed refresh complete: {results}")
    return results


@shared_task(name="apps.spider.tasks.fetch_alpha_vantage_quotes")
def fetch_alpha_vantage_quotes():
    """
    Fetch real-time quotes from Alpha Vantage API.

    Updates company prices for symbols that haven't been updated recently.
    Alpha Vantage has good coverage for global markets including African stocks.

    Note: Free tier is limited to 5 calls/minute, 500 calls/day.
    Schedule: Every 5 minutes (staggered to respect rate limits)
    """
    from decimal import Decimal
    from .providers import AlphaVantageProvider
    from apps.markets.models import Company
    import time

    try:
        provider = AlphaVantageProvider()

        # Get companies that need price updates (not updated in last 5 minutes)
        cutoff = timezone.now() - timezone.timedelta(minutes=5)
        companies = Company.objects.filter(
            is_active=True,
            updated_at__lt=cutoff
        ).order_by('updated_at')[:5]  # Only 5 per run to respect rate limits

        updated = 0

        for company in companies:
            try:
                # Try to get quote from Alpha Vantage
                quote = provider.get_quote(company.symbol)

                if quote and quote.get('price'):
                    company.current_price = quote['price']
                    company.previous_close = quote.get('previous_close', company.previous_close)
                    company.day_open = quote.get('open', company.day_open)
                    company.day_high = quote.get('high', company.day_high)
                    company.day_low = quote.get('low', company.day_low)
                    company.volume = quote.get('volume', company.volume)
                    company.save()
                    updated += 1
                    logger.info(f"Alpha Vantage updated: {company.symbol} @ {quote['price']}")

                # Respect rate limit - wait 12 seconds between calls (5/minute limit)
                time.sleep(12)

            except Exception as e:
                logger.warning(f"Alpha Vantage quote failed for {company.symbol}: {e}")
                continue

        logger.info(f"Alpha Vantage: Updated {updated} companies")
        return f"Alpha Vantage: Updated {updated} companies"

    except Exception as e:
        logger.error(f"Alpha Vantage quotes task failed: {e}")
        raise


@shared_task(name="apps.spider.tasks.fetch_alpha_vantage_company_data")
def fetch_alpha_vantage_company_data(symbol: str):
    """
    Fetch detailed company data from Alpha Vantage.

    Gets fundamental data like market cap, P/E ratio, sector, etc.
    Called on-demand when viewing a company page.
    """
    from .providers import AlphaVantageProvider
    from apps.markets.models import Company

    try:
        provider = AlphaVantageProvider()
        company = Company.objects.filter(symbol=symbol).first()

        if not company:
            logger.warning(f"Company not found: {symbol}")
            return None

        # Get company overview
        overview = provider.get_company_overview(symbol)

        if overview:
            if overview.get('market_cap'):
                try:
                    company.market_cap = int(overview['market_cap'])
                except (ValueError, TypeError):
                    pass

            if overview.get('pe_ratio'):
                try:
                    from decimal import Decimal
                    company.pe_ratio = Decimal(str(overview['pe_ratio']))
                except (ValueError, TypeError):
                    pass

            if overview.get('description'):
                company.description = overview['description'][:2000]

            if overview.get('sector'):
                company.sector_text = overview['sector']

            if overview.get('industry'):
                company.industry_text = overview['industry']

            company.save()
            logger.info(f"Alpha Vantage company data updated: {symbol}")
            return overview

        return None

    except Exception as e:
        logger.error(f"Alpha Vantage company data failed for {symbol}: {e}")
        raise
