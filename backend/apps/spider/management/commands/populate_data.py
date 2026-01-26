"""
Management command to populate the database with news and market data.

Usage:
    python manage.py populate_data
    python manage.py populate_data --news-only
    python manage.py populate_data --markets-only
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Populate database with news and market data from various sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--news-only',
            action='store_true',
            help='Only fetch news data',
        )
        parser.add_argument(
            '--markets-only',
            action='store_true',
            help='Only fetch market data',
        )
        parser.add_argument(
            '--scrapers-only',
            action='store_true',
            help='Only run web scrapers',
        )
        parser.add_argument(
            '--videos-only',
            action='store_true',
            help='Only fetch YouTube videos',
        )
        parser.add_argument(
            '--images-only',
            action='store_true',
            help='Only download article images',
        )

    def handle(self, *args, **options):
        news_only = options.get('news_only')
        markets_only = options.get('markets_only')
        scrapers_only = options.get('scrapers_only')
        videos_only = options.get('videos_only')
        images_only = options.get('images_only')

        # If no specific option, run everything
        run_all = not (news_only or markets_only or scrapers_only or videos_only or images_only)

        self.stdout.write(self.style.SUCCESS('Starting data population...'))
        self.stdout.write(f'Time: {timezone.now()}')
        self.stdout.write('-' * 50)

        # Create base categories and exchanges first
        if run_all or markets_only:
            self._setup_base_data()

        # Fetch news
        if run_all or news_only:
            self._fetch_news()

        # Fetch market data
        if run_all or markets_only:
            self._fetch_markets()

        # Run scrapers
        if run_all or scrapers_only:
            self._run_scrapers()

        # Fetch YouTube videos
        if run_all or videos_only:
            self._fetch_videos()

        # Download article images
        if run_all or images_only:
            self._download_images()

        # Set featured article
        if run_all:
            self._set_featured()

        self.stdout.write('-' * 50)
        self.stdout.write(self.style.SUCCESS('Data population complete!'))

    def _setup_base_data(self):
        """Set up base categories and exchanges."""
        from apps.news.models import Category
        from apps.markets.models import Exchange

        self.stdout.write('\n[1] Setting up base data...')

        # Create categories
        categories = [
            ('business', 'Business', 'Business news and updates'),
            ('markets', 'Markets', 'Market news and analysis'),
            ('technology', 'Technology', 'Technology and fintech news'),
            ('economy', 'Economy', 'Economic news and indicators'),
            ('commodities', 'Commodities', 'Commodities and resources'),
            ('banking', 'Banking', 'Banking and finance sector'),
            ('africa', 'Africa', 'Pan-African news and developments'),
        ]

        for slug, name, description in categories:
            cat, created = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'description': description}
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  Category: {name} - {status}')

        # Create exchanges
        exchanges = [
            ('JSE', 'Johannesburg Stock Exchange', 'South Africa', 'ZAR', 'Africa/Johannesburg'),
            ('ZSE', 'Zimbabwe Stock Exchange', 'Zimbabwe', 'USD', 'Africa/Harare'),
            ('BSE', 'Botswana Stock Exchange', 'Botswana', 'BWP', 'Africa/Gaborone'),
            ('NSE', 'Nigerian Stock Exchange', 'Nigeria', 'NGN', 'Africa/Lagos'),
            ('EGX', 'Egyptian Exchange', 'Egypt', 'EGP', 'Africa/Cairo'),
            ('BRVM', 'Bourse Regionale', 'Ivory Coast', 'XOF', 'Africa/Abidjan'),
        ]

        for code, name, country, currency, tz in exchanges:
            exchange, created = Exchange.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'country': country,
                    'currency': currency,
                    'timezone': tz,
                    'is_active': True,
                }
            )
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  Exchange: {name} - {status}')

    def _fetch_news(self):
        """Fetch news from various sources."""
        self.stdout.write('\n[2] Fetching news...')

        # Polygon news
        try:
            from apps.spider.tasks import fetch_polygon_news
            self.stdout.write('  Fetching Polygon.io news...')
            result = fetch_polygon_news()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Polygon news failed: {e}'))

        # NewsAPI headlines
        try:
            from apps.spider.tasks import fetch_newsapi_headlines
            self.stdout.write('  Fetching NewsAPI headlines...')
            result = fetch_newsapi_headlines()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    NewsAPI headlines failed: {e}'))

        # African market news
        try:
            from apps.spider.tasks import fetch_african_news
            self.stdout.write('  Fetching African market news...')
            result = fetch_african_news()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    African news failed: {e}'))

    def _fetch_markets(self):
        """Fetch market data."""
        self.stdout.write('\n[3] Fetching market data...')

        # Polygon indices
        try:
            from apps.spider.tasks import fetch_polygon_indices
            self.stdout.write('  Fetching Polygon.io indices...')
            result = fetch_polygon_indices()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Polygon indices failed: {e}'))

    def _run_scrapers(self):
        """Run web scrapers."""
        self.stdout.write('\n[4] Running web scrapers...')

        # African news websites
        try:
            from apps.spider.tasks import scrape_african_news_websites
            self.stdout.write('  Scraping African news websites...')
            result = scrape_african_news_websites()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    African news scraping failed: {e}'))

        # JSE scraper
        try:
            from apps.spider.tasks import scrape_jse_data
            self.stdout.write('  Scraping JSE data...')
            result = scrape_jse_data()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    JSE scraping failed: {e}'))

        # ZSE scraper
        try:
            from apps.spider.tasks import scrape_zse_data
            self.stdout.write('  Scraping ZSE data...')
            result = scrape_zse_data()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    ZSE scraping failed: {e}'))

        # BSE scraper
        try:
            from apps.spider.tasks import scrape_bse_data
            self.stdout.write('  Scraping BSE data...')
            result = scrape_bse_data()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    BSE scraping failed: {e}'))

    def _fetch_videos(self):
        """Fetch YouTube videos about African finance."""
        self.stdout.write('\n[5] Fetching YouTube videos...')

        try:
            from apps.spider.tasks import fetch_youtube_african_finance
            self.stdout.write('  Fetching African finance videos...')
            result = fetch_youtube_african_finance()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    YouTube fetch failed: {e}'))

    def _download_images(self):
        """Set image URLs for articles."""
        self.stdout.write('\n[6] Setting article image URLs...')

        try:
            from apps.spider.tasks import set_article_images
            self.stdout.write('  Setting image URLs from Unsplash...')
            result = set_article_images()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Set image URLs failed: {e}'))

    def _set_featured(self):
        """Set a featured article."""
        self.stdout.write('\n[7] Setting featured article...')

        try:
            from apps.spider.tasks import set_featured_article
            self.stdout.write('  Setting featured article...')
            result = set_featured_article()
            self.stdout.write(self.style.SUCCESS(f'    {result}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Set featured failed: {e}'))
