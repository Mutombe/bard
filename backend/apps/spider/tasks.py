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
                featured_image=item.get('image_url', ''),
                category=category,
                status='published',
                published_at=timezone.now(),
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

            NewsArticle.objects.create(
                title=item['title'][:500],
                excerpt=item.get('description', '')[:500] if item.get('description') else '',
                content=item.get('content', '') or item.get('description', ''),
                featured_image=item.get('image_url', ''),
                category=category,
                status='published',
                published_at=timezone.now(),
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
                featured_image=item.get('image_url', ''),
                category=category,
                status='published',
                published_at=timezone.now(),
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
