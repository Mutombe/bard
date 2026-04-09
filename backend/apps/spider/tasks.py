"""
Spider Tasks

Scheduled tasks for market data scraping.
Includes integration with Polygon.io and NewsAPI.org

Tasks are plain functions — called by django-q2 scheduler or management commands.
"""
import logging
import re
from datetime import timedelta
from dateutil import parser as dateparser
from django.utils import timezone

logger = logging.getLogger(__name__)

# Maximum age for articles — skip anything older than this
MAX_ARTICLE_AGE_DAYS = 7


def parse_article_date(date_str: str):
    """
    Parse article date from SerpAPI (e.g., '2 days ago', 'Mar 15, 2026', '3 hours ago').
    Returns a timezone-aware datetime or None if unparsable.
    """
    if not date_str:
        return None

    now = timezone.now()
    text = date_str.lower().strip()

    # Relative dates: "X hours/minutes/days ago"
    relative = re.match(r'(\d+)\s+(minute|hour|day|week|month)s?\s+ago', text)
    if relative:
        amount = int(relative.group(1))
        unit = relative.group(2)
        deltas = {
            'minute': timedelta(minutes=amount),
            'hour': timedelta(hours=amount),
            'day': timedelta(days=amount),
            'week': timedelta(weeks=amount),
            'month': timedelta(days=amount * 30),
        }
        return now - deltas.get(unit, timedelta())

    # "just now" / "today" / "yesterday"
    if 'just now' in text or 'moment' in text:
        return now
    if text == 'today':
        return now
    if text == 'yesterday':
        return now - timedelta(days=1)

    # Try standard date parsing
    try:
        parsed = dateparser.parse(date_str, fuzzy=True)
        if parsed:
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed)
            return parsed
    except (ValueError, OverflowError):
        pass

    return None


def is_article_fresh(date_str: str) -> bool:
    """Check if an article is within MAX_ARTICLE_AGE_DAYS. Unknown dates pass."""
    parsed = parse_article_date(date_str)
    if not parsed:
        return True  # Unknown date — let it through
    age = timezone.now() - parsed
    return age.days <= MAX_ARTICLE_AGE_DAYS


def fetch_polygon_news():
    """
    Fetch financial news from Polygon.io API.

    Fetches general news + ticker-specific news for African-relevant tickers
    to get a diverse set of articles each cycle.

    Schedule: Every 30 minutes
    """
    from .providers import PolygonDataProvider
    from apps.news.models import NewsArticle, Category

    # African and emerging market relevant tickers for diverse news
    TICKER_QUERIES = [
        None,           # General market news
        'AAPL',         # Tech bellwether
        'JPM',          # Banking
        'XOM',          # Energy
        'GOLD',         # Gold/mining
        'BHP',          # Mining/resources
        'VALE',         # Commodities
        'BABA',         # Emerging markets
    ]

    try:
        provider = PolygonDataProvider()

        # Category mapping for ticker-based news
        category_map = {}
        for slug, name, desc in [
            ('business', 'Business', 'Business news'),
            ('markets', 'Markets', 'Market news and analysis'),
            ('technology', 'Technology', 'Technology news'),
            ('commodities', 'Commodities', 'Commodities and resources'),
            ('banking', 'Banking', 'Banking and finance'),
        ]:
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={'name': name, 'description': desc}
            )
            category_map[slug] = cat

        default_category = category_map['business']

        # Map tickers to categories
        ticker_categories = {
            'AAPL': 'technology', 'JPM': 'banking', 'XOM': 'commodities',
            'GOLD': 'commodities', 'BHP': 'commodities', 'VALE': 'commodities',
        }

        saved = 0
        seen_titles = set()

        # Rotate through tickers - pick 2-3 per cycle to avoid rate limits
        import hashlib
        hour_hash = int(hashlib.md5(
            timezone.now().strftime('%Y-%m-%d-%H').encode()
        ).hexdigest(), 16)
        # Always include general (None) + 2 rotated tickers
        rotated = [None] + [
            TICKER_QUERIES[1 + (hour_hash + i) % (len(TICKER_QUERIES) - 1)]
            for i in range(2)
        ]

        for ticker in rotated:
            try:
                news_items = provider.get_ticker_news(ticker=ticker, limit=10)
            except Exception as e:
                logger.warning(f"Polygon fetch for ticker={ticker} failed: {e}")
                continue

            cat_slug = ticker_categories.get(ticker, 'business') if ticker else 'business'
            category = category_map.get(cat_slug, default_category)

            for item in news_items:
                title = (item.get('title') or '').strip()
                if not title:
                    continue

                # Deduplicate within this batch
                if title[:500] in seen_titles:
                    continue
                seen_titles.add(title[:500])

                # Check DB for existing article by title OR external URL
                ext_url = item.get('article_url', '') or item.get('url', '')
                if NewsArticle.objects.filter(title=title[:500]).exists():
                    continue
                if ext_url and NewsArticle.objects.filter(external_url=ext_url).exists():
                    continue

                content = item.get('description', '') or ''
                has_full_body = len(content) >= 500

                NewsArticle.objects.create(
                    title=title[:500],
                    excerpt=content[:500],
                    content=content,
                    category=category,
                    status='published' if has_full_body else 'draft',
                    published_at=timezone.now() if has_full_body else None,
                    source='polygon',
                    external_url=ext_url,
                    external_source_name=item.get('publisher', {}).get('name', 'Polygon.io') if isinstance(item.get('publisher'), dict) else item.get('source', 'Polygon.io'),
                    featured_image_url=item.get('image_url', ''),
                )
                saved += 1

        logger.info(f"Polygon news: saved {saved} new articles")
        return f"Polygon: saved {saved} articles"

    except Exception as e:
        logger.error(f"Polygon news fetch failed: {e}")
        raise


def fetch_serpapi_news():
    """
    Fetch business/finance news from Google News via SerpAPI.

    Discovers articles via Google News search, then extracts full article
    content from source URLs using trafilatura. Every article gets an HD
    image — either from the source or fetched from Unsplash based on content.

    Schedule: Every 30 minutes
    """
    from .providers import SerpAPIProvider
    from apps.news.models import NewsArticle, Category
    from apps.media.image_service import ArticleImageService
    import hashlib

    # Africa-focused economic and finance queries
    # Covers all industry/topic pages to ensure no empty sections
    NEWS_QUERIES = [
        # Core markets & economy
        'Africa economy finance news today',
        'South Africa economy JSE market',
        'Nigeria economy business finance',
        'Kenya East Africa business economy',
        # Banking & monetary policy
        'Africa central bank monetary policy interest rates',
        'African banking sector regulation fintech',
        'Reserve Bank South Africa Nigeria Kenya central bank',
        # Mining & commodities
        'Africa mining commodities gold platinum resources',
        'Africa oil gas energy prices',
        # Infrastructure & development
        'Africa infrastructure investment development construction',
        'Africa energy renewable solar power',
        # Technology
        'Africa fintech banking digital finance mobile money',
        'Africa technology startups venture capital',
        # Trade & policy
        'AfCFTA Africa free trade agreement continental',
        'Africa trade policy exports imports',
        'Africa foreign direct investment FDI',
        # Agriculture
        'Africa agriculture food security commodities',
        # Development banks
        'African Development Bank economy development',
        # Global impact
        'Africa emerging markets global economy',
    ]

    try:
        provider = SerpAPIProvider()
        image_service = ArticleImageService()

        # Category mapping by keyword detection
        categories = {}
        for slug, name, desc in [
            ('africa', 'Africa', 'Pan-African news'),
            ('markets', 'Markets', 'Market news and analysis'),
            ('technology', 'Technology', 'Technology news'),
            ('commodities', 'Commodities', 'Commodities and resources'),
            ('banking', 'Banking', 'Banking and finance'),
            ('economy', 'Economy', 'Economic news and policy'),
            ('trade', 'Trade', 'Trade policy and agreements'),
            ('infrastructure', 'Infrastructure', 'Infrastructure and development'),
            ('agriculture', 'Agriculture', 'Agriculture and food security'),
            ('energy', 'Energy', 'Energy and resources'),
        ]:
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={'name': name, 'description': desc}
            )
            categories[slug] = cat

        default_category = categories['africa']

        # Rotate: pick 3 queries per cycle for broader coverage
        hour_hash = int(hashlib.md5(
            timezone.now().strftime('%Y-%m-%d-%H').encode()
        ).hexdigest(), 16)

        selected = []
        for i in range(3):
            idx = (hour_hash + i) % len(NEWS_QUERIES)
            q = NEWS_QUERIES[idx]
            if q not in selected:
                selected.append(q)

        saved = 0
        seen_titles = set()

        # Map queries to categories
        query_categories = {
            'South Africa economy JSE market': 'markets',
            'Nigeria economy business finance': 'economy',
            'Kenya East Africa business economy': 'economy',
            'Africa central bank monetary policy interest rates': 'banking',
            'African banking sector regulation fintech': 'banking',
            'Reserve Bank South Africa Nigeria Kenya central bank': 'banking',
            'Africa mining commodities gold platinum resources': 'commodities',
            'Africa oil gas energy prices': 'energy',
            'Africa infrastructure investment development construction': 'infrastructure',
            'Africa energy renewable solar power': 'energy',
            'Africa fintech banking digital finance mobile money': 'technology',
            'Africa technology startups venture capital': 'technology',
            'AfCFTA Africa free trade agreement continental': 'trade',
            'Africa trade policy exports imports': 'trade',
            'Africa foreign direct investment FDI': 'economy',
            'Africa agriculture food security commodities': 'agriculture',
            'African Development Bank economy development': 'banking',
            'Africa emerging markets global economy': 'markets',
        }

        for query in selected:
            articles = provider.search_news(
                query,
                gl='za',
                extract_content=True,
            )

            cat_slug = query_categories.get(query, 'business')
            category = categories.get(cat_slug, default_category)

            for item in articles:
                title = (item.get('title') or '').strip()
                if not title:
                    continue

                if title[:500] in seen_titles:
                    continue
                seen_titles.add(title[:500])

                # Skip old articles (> 7 days)
                date_str = item.get('published_at', '')
                if not is_article_fresh(date_str):
                    continue

                ext_url = item.get('url', '')
                if NewsArticle.objects.filter(title=title[:500]).exists():
                    continue
                if ext_url and NewsArticle.objects.filter(external_url=ext_url[:500]).exists():
                    continue

                content = item.get('content', '') or ''
                excerpt = item.get('description', '') or ''

                # Skip articles without substantial scraped body
                if len(content) < 500:
                    continue

                # Use real publish date, fallback to now
                pub_date = parse_article_date(date_str) or timezone.now()

                # Always fetch HD image from Unsplash based on article context
                image_data = image_service.get_image_for_article(
                    title=title,
                    excerpt=excerpt,
                    category_slug=cat_slug,
                    content=content[:500],
                )
                image_url = image_data.get('url', '')

                try:
                    NewsArticle.objects.create(
                        title=title[:500],
                        excerpt=(excerpt or content[:300])[:500],
                        content=content,
                        category=category,
                        status='published',
                        published_at=pub_date,
                        source='serpapi',
                        external_url=ext_url[:500],
                        external_source_name=item.get('source', 'Google News')[:100],
                        featured_image_url=(image_url or '')[:500],
                    )
                    saved += 1
                except Exception as e:
                    logger.warning(f"Failed to save article '{title[:60]}': {e}")
                    continue

        logger.info(f"SerpAPI news: saved {saved} new articles")
        return f"SerpAPI: saved {saved} articles"

    except Exception as e:
        logger.error(f"SerpAPI news fetch failed: {e}")
        raise


def fetch_african_news():
    """
    Fetch African market-specific news from Google News via SerpAPI.

    Searches for African finance/economy news and extracts full article
    content from source URLs. Every article gets an HD Unsplash image
    if the source doesn't provide one.

    Schedule: Every hour
    """
    from .providers import SerpAPIProvider
    from apps.news.models import NewsArticle, Category
    from apps.media.image_service import ArticleImageService

    try:
        provider = SerpAPIProvider()
        image_service = ArticleImageService()

        africa_cat, _ = Category.objects.get_or_create(
            slug='africa',
            defaults={'name': 'Africa', 'description': 'Pan-African news'}
        )
        markets_cat, _ = Category.objects.get_or_create(
            slug='markets',
            defaults={'name': 'Markets', 'description': 'Market news and analysis'}
        )

        articles = provider.get_african_market_news()

        saved = 0
        seen_titles = set()

        for item in articles:
            title = (item.get('title') or '').strip()
            if not title:
                continue

            if title[:500] in seen_titles:
                continue
            seen_titles.add(title[:500])

            # Skip old articles (> 7 days)
            date_str = item.get('published_at', '')
            if not is_article_fresh(date_str):
                continue

            ext_url = item.get('url', '')
            if NewsArticle.objects.filter(title=title[:500]).exists():
                continue
            if ext_url and NewsArticle.objects.filter(external_url=ext_url[:500]).exists():
                continue

            content = item.get('content', '') or ''
            excerpt = item.get('description', '') or ''

            # Skip articles without substantial scraped body
            if len(content) < 500:
                continue

            # Use real publish date, fallback to now
            pub_date = parse_article_date(date_str) or timezone.now()

            # Assign category based on content keywords
            content_lower = (content + ' ' + title).lower()
            if any(kw in content_lower for kw in ['stock', 'market', 'exchange', 'index', 'trading']):
                category = markets_cat
                cat_slug = 'markets'
            else:
                category = africa_cat
                cat_slug = 'africa'

            # Always fetch HD image from Unsplash based on article context
            image_data = image_service.get_image_for_article(
                title=title,
                excerpt=excerpt,
                category_slug=cat_slug,
                content=content[:500],
            )
            image_url = image_data.get('url', '')

            try:
                NewsArticle.objects.create(
                    title=title[:500],
                    excerpt=(excerpt or content[:300])[:500],
                    content=content,
                    category=category,
                    status='published',
                    published_at=pub_date,
                    source='serpapi',
                    external_url=ext_url[:500],
                    external_source_name=item.get('source', 'African News')[:100],
                    featured_image_url=(image_url or '')[:500],
                )
                saved += 1
            except Exception as e:
                logger.warning(f"Failed to save article '{title[:60]}': {e}")
                continue

        logger.info(f"African news (SerpAPI): saved {saved} new articles")
        return f"African news: saved {saved} articles"

    except Exception as e:
        logger.error(f"African news fetch failed: {e}")
        raise


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


def scrape_vfex_data():
    """
    Scrape Victoria Falls Stock Exchange (VFEX) data.
    Trading currency: USD

    Schedule: Every 15 minutes, 08:00-16:00 Mon-Fri
    """
    return scrape_african_financials(exchange_code="VFEX")


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


def set_article_images():
    """
    Set contextual HD Unsplash images for articles.

    Uses smart visual concept mapping to batch articles by topic, then fetches
    one Unsplash search per unique topic and distributes results across articles.
    This is MUCH more API-efficient: 20 articles about Kenya = 1 API call, not 20.

    Schedule: Every hour
    """
    from apps.news.models import NewsArticle
    from apps.media.image_service import ArticleImageService, UnsplashService
    import hashlib

    try:
        from django.db.models import Q

        # Get articles needing contextual images (generic fallback = no ixid param)
        needs_image = list(
            NewsArticle.objects.filter(
                status='published',
            ).filter(
                Q(featured_image_url='') |
                ~Q(featured_image_url__contains='images.unsplash.com') |
                (
                    Q(featured_image_url__contains='images.unsplash.com') &
                    ~Q(featured_image_url__contains='ixid=')
                )
            ).order_by('-is_featured', '-published_at')[:200]
        )

        if not needs_image:
            return "No articles need images"

        image_service = ArticleImageService()
        unsplash = UnsplashService()

        # Step 1: Group articles by their visual search query
        # This lets us make ONE API call per unique query instead of per article
        query_groups = {}  # { search_query: [article, ...] }
        for article in needs_image:
            cat_slug = article.category.slug if article.category else ''
            query = image_service._build_search_query(
                article.title,
                article.excerpt or '',
                cat_slug,
                '',
            )
            if query not in query_groups:
                query_groups[query] = []
            query_groups[query].append(article)

        logger.info(
            f"Grouped {len(needs_image)} articles into {len(query_groups)} unique queries"
        )

        saved = 0
        api_calls = 0
        MAX_API_CALLS = 45  # Stay under 50/hr rate limit

        for query, articles in query_groups.items():
            if api_calls >= MAX_API_CALLS:
                logger.info(f"Rate limit reached after {api_calls} API calls, {saved} saved")
                break

            # Fetch 10 results for this query
            results = None
            if unsplash.is_configured:
                results = unsplash.search_photo(query, per_page=10, use_cache=False)
                api_calls += 1

                # If no results, try category fallback query
                if not results or not results.get('all_results'):
                    cat_slug = articles[0].category.slug if articles[0].category else ''
                    cat_query = image_service.CATEGORY_QUERIES.get(cat_slug, '')
                    if cat_query and cat_query != query:
                        results = unsplash.search_photo(cat_query, per_page=10, use_cache=False)
                        api_calls += 1

            all_photos = (results or {}).get('all_results', [])

            # Distribute images across all articles in this group
            for article in articles:
                try:
                    if all_photos:
                        # Use article ID hash to pick a unique image from results
                        seed = int(hashlib.md5(str(article.id).encode()).hexdigest()[:8], 16)
                        idx = seed % len(all_photos)
                        image_url = all_photos[idx].get('url')
                    else:
                        # API unavailable — use category fallback from image service
                        cat_slug = article.category.slug if article.category else 'default'
                        fallback_list = image_service.FALLBACK_IMAGES.get(
                            cat_slug, image_service.FALLBACK_IMAGES['default']
                        )
                        seed = int(hashlib.md5(str(article.id).encode()).hexdigest()[:8], 16)
                        image_url = fallback_list[seed % len(fallback_list)]

                    if image_url:
                        article.featured_image_url = image_url
                        article.save(update_fields=['featured_image_url'])
                        saved += 1

                except Exception as e:
                    logger.error(f"Failed to set image for {article.id}: {e}")
                    continue

        logger.info(f"Set images for {saved} articles using {api_calls} API calls")
        return f"Set {saved} images with {api_calls} API calls ({len(query_groups)} unique queries)"

    except Exception as e:
        logger.error(f"Set article images failed: {e}")
        raise


def set_featured_article():
    """
    Rotate the featured article to the most recent published article with an image.

    Always promotes the newest article to featured, ensuring the homepage
    hero section stays fresh with every content refresh cycle.
    Schedule: Every 2 hours (via --news-only and --images-only cron jobs)
    """
    from apps.news.models import NewsArticle

    try:
        from django.db.models import Q

        # Find the most recent published article with an image
        # Check BOTH local featured_image AND external featured_image_url
        candidate = NewsArticle.objects.filter(
            status='published',
        ).filter(
            Q(~Q(featured_image=''), featured_image__isnull=False) |
            Q(~Q(featured_image_url=''), featured_image_url__isnull=False)
        ).order_by('-published_at').first()

        if not candidate:
            # Fallback: any published article
            candidate = NewsArticle.objects.filter(
                status='published'
            ).order_by('-published_at').first()

        if not candidate:
            return "No articles to feature"

        # Check if this is already the featured article
        if candidate.is_featured:
            return f"Already featured: {candidate.title[:50]}"

        # Unfeature all other articles
        NewsArticle.objects.filter(is_featured=True).update(is_featured=False)

        # Feature the newest article
        candidate.is_featured = True
        candidate.save(update_fields=['is_featured'])

        has_image = bool(candidate.featured_image or candidate.featured_image_url)
        logger.info(f"Rotated featured article to: {candidate.title} (has_image={has_image})")
        return f"Featured: {candidate.title[:50]}"

    except Exception as e:
        logger.error(f"Set featured article failed: {e}")
        raise


# =========================
# CNBC Africa Video Integration
# =========================
# CNBC Africa YouTube Channel: https://www.youtube.com/@Cnbcafrica410
# Channel ID: UCqXiCKq3jLqR-i_tCODQSow (CNBC Africa)
CNBC_AFRICA_CHANNEL_ID = "UCsba91UGiQLFOb5DN3Z_AdQ"


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
    from apps.media.image_service import ArticleImageService

    # Reset image dedup tracker for this cycle
    ArticleImageService.reset_session()

    results = []

    # 0. Direct scrape from African RSS feeds + trafilatura
    try:
        from .african_news import scrape_and_save_african_news
        results.append(f"Direct scrape: saved {scrape_and_save_african_news()} articles")
    except Exception as e:
        results.append(f"Direct scrape failed: {e}")

    # 1. Fetch Africa-focused news from SerpAPI
    try:
        results.append(fetch_serpapi_news())
    except Exception as e:
        results.append(f"SerpAPI failed: {e}")

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

    # 5. Retry scraping draft articles that failed previously
    try:
        results.append(backfill_draft_articles())
    except Exception as e:
        results.append(f"Backfill failed: {e}")

    logger.info(f"Feed refresh complete: {results}")
    return results


def backfill_draft_articles(batch_size: int = 50):
    """
    Re-attempt content extraction for draft articles with external URLs.

    Many articles land in draft because trafilatura couldn't fetch their body
    on the first try (403s, DNS failures, timeouts). This retries them.

    Schedule: Part of refresh_feed_content cycle.
    """
    from apps.news.models import NewsArticle
    from .providers import SerpAPIProvider
    from django.db.models.functions import Length

    drafts = (
        NewsArticle.objects
        .filter(status='draft')
        .exclude(external_url='')
        .exclude(external_url__isnull=True)
        .annotate(clen=Length('content'))
        .filter(clen__lt=500)
        .order_by('-created_at')[:batch_size]
    )

    if not drafts:
        return "No draft articles to backfill"

    promoted = 0
    for article in drafts:
        content = SerpAPIProvider.extract_full_article(article.external_url)
        if content and len(content) >= 500:
            article.content = content
            article.status = 'published'
            article.published_at = article.published_at or timezone.now()
            article.excerpt = article.excerpt or content[:300]
            article.save(update_fields=['content', 'status', 'published_at', 'excerpt'])
            promoted += 1

    logger.info(f"Backfill: promoted {promoted}/{len(drafts)} draft articles to published")
    return f"Backfill: promoted {promoted} articles"


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
