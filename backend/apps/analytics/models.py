"""
Analytics Models

Comprehensive analytics and tracking system for:
- Article performance metrics
- User engagement tracking
- System health monitoring
- Scraped content quality
- Admin dashboard data
"""
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class ArticleAnalytics(TimeStampedModel):
    """
    Per-article analytics with hourly granularity.
    """

    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="analytics",
    )
    date = models.DateField(
        "Date",
        db_index=True,
    )
    hour = models.PositiveSmallIntegerField(
        "Hour",
        default=0,
        help_text="Hour of day (0-23)",
    )

    # Traffic metrics
    page_views = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)

    # Engagement metrics
    avg_time_on_page = models.PositiveIntegerField(
        default=0,
        help_text="Average time in seconds",
    )
    scroll_depth_avg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Average scroll depth percentage",
    )
    bounce_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    # Social engagement
    social_shares = models.PositiveIntegerField(default=0)
    comments = models.PositiveIntegerField(default=0)

    # Traffic sources
    source_direct = models.PositiveIntegerField(default=0)
    source_search = models.PositiveIntegerField(default=0)
    source_social = models.PositiveIntegerField(default=0)
    source_referral = models.PositiveIntegerField(default=0)
    source_email = models.PositiveIntegerField(default=0)

    # Device breakdown
    device_desktop = models.PositiveIntegerField(default=0)
    device_mobile = models.PositiveIntegerField(default=0)
    device_tablet = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Article Analytics"
        verbose_name_plural = "Article Analytics"
        unique_together = [["article", "date", "hour"]]
        indexes = [
            models.Index(fields=["date", "hour"]),
            models.Index(fields=["article", "date"]),
        ]

    def __str__(self):
        return f"{self.article.headline[:30]} - {self.date} H{self.hour}"


class DailyMetrics(TimeStampedModel):
    """
    Site-wide daily metrics.
    """

    date = models.DateField(
        "Date",
        unique=True,
        db_index=True,
    )

    # Traffic
    total_page_views = models.BigIntegerField(default=0)
    total_unique_visitors = models.BigIntegerField(default=0)
    total_sessions = models.BigIntegerField(default=0)

    # Content
    articles_published = models.PositiveIntegerField(default=0)
    articles_updated = models.PositiveIntegerField(default=0)
    articles_scraped = models.PositiveIntegerField(default=0)

    # Users
    new_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)
    new_subscribers = models.PositiveIntegerField(default=0)
    churned_subscribers = models.PositiveIntegerField(default=0)

    # Engagement
    newsletter_sends = models.PositiveIntegerField(default=0)
    newsletter_opens = models.PositiveIntegerField(default=0)
    newsletter_clicks = models.PositiveIntegerField(default=0)
    price_alerts_sent = models.PositiveIntegerField(default=0)

    # Market data
    market_data_updates = models.PositiveIntegerField(default=0)
    api_requests = models.BigIntegerField(default=0)

    # Performance
    avg_response_time_ms = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Daily Metrics"
        verbose_name_plural = "Daily Metrics"
        ordering = ["-date"]

    def __str__(self):
        return f"Metrics: {self.date}"


class UserActivityLog(TimeStampedModel):
    """
    Detailed user activity tracking.
    """

    class ActivityType(models.TextChoices):
        PAGE_VIEW = "page_view", "Page View"
        ARTICLE_READ = "article_read", "Article Read"
        SEARCH = "search", "Search"
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        WATCHLIST_ADD = "watchlist_add", "Watchlist Add"
        WATCHLIST_REMOVE = "watchlist_remove", "Watchlist Remove"
        NEWSLETTER_SUBSCRIBE = "nl_subscribe", "Newsletter Subscribe"
        PRICE_ALERT_CREATE = "alert_create", "Price Alert Create"
        SHARE = "share", "Share"
        DOWNLOAD = "download", "Download"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="activity_logs",
        null=True,
        blank=True,
    )
    session_id = models.CharField(
        "Session ID",
        max_length=100,
        blank=True,
    )
    activity_type = models.CharField(
        "Type",
        max_length=20,
        choices=ActivityType.choices,
    )

    # Context
    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    company = models.ForeignKey(
        "markets.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    url = models.URLField(
        "URL",
        blank=True,
    )
    referrer = models.URLField(
        "Referrer",
        blank=True,
    )
    search_query = models.CharField(
        "Search Query",
        max_length=500,
        blank=True,
    )

    # Technical
    ip_address = models.GenericIPAddressField(
        "IP Address",
        null=True,
        blank=True,
    )
    user_agent = models.TextField(
        "User Agent",
        blank=True,
    )
    device_type = models.CharField(
        "Device Type",
        max_length=20,
        blank=True,
    )
    country_code = models.CharField(
        "Country",
        max_length=3,
        blank=True,
    )

    # Metadata
    metadata = models.JSONField(
        "Metadata",
        default=dict,
    )

    class Meta:
        verbose_name = "User Activity Log"
        verbose_name_plural = "User Activity Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["activity_type", "-created_at"]),
            models.Index(fields=["article", "-created_at"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.activity_type}: {self.user or 'Anonymous'}"


class ContentPerformance(TimeStampedModel):
    """
    Aggregated content performance metrics.

    Updated periodically via Celery task.
    """

    article = models.OneToOneField(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="performance",
    )

    # Lifetime metrics
    total_views = models.BigIntegerField(default=0)
    unique_visitors = models.BigIntegerField(default=0)
    avg_read_time = models.PositiveIntegerField(
        default=0,
        help_text="Average read time in seconds",
    )
    completion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Percentage of users who read to the end",
    )

    # Engagement
    total_shares = models.PositiveIntegerField(default=0)
    total_comments = models.PositiveIntegerField(default=0)
    engagement_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Calculated engagement score (0-100)",
    )

    # SEO
    search_impressions = models.BigIntegerField(default=0)
    search_clicks = models.BigIntegerField(default=0)
    avg_search_position = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    # Trends
    views_7d = models.PositiveIntegerField(default=0)
    views_30d = models.PositiveIntegerField(default=0)
    trend_direction = models.CharField(
        max_length=10,
        choices=[("up", "Up"), ("down", "Down"), ("stable", "Stable")],
        default="stable",
    )
    trend_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
    )

    last_calculated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Content Performance"
        verbose_name_plural = "Content Performance"

    def __str__(self):
        return f"Performance: {self.article.headline[:50]}"


class ScrapingMetrics(TimeStampedModel):
    """
    Metrics for scraped content quality and spider performance.
    """

    class SpiderType(models.TextChoices):
        JSE = "jse", "JSE Spider"
        ZSE = "zse", "ZSE Spider"
        BSE = "bse", "BSE Spider"
        NEWS = "news", "News Spider"
        FOREX = "forex", "Forex Spider"

    spider_type = models.CharField(
        "Spider Type",
        max_length=20,
        choices=SpiderType.choices,
    )
    date = models.DateField(
        "Date",
        db_index=True,
    )

    # Run stats
    run_count = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    failure_count = models.PositiveIntegerField(default=0)
    avg_run_time_seconds = models.PositiveIntegerField(default=0)

    # Data quality
    items_scraped = models.PositiveIntegerField(default=0)
    items_validated = models.PositiveIntegerField(default=0)
    items_rejected = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)

    # Errors
    error_details = models.JSONField(
        "Error Details",
        default=list,
    )

    # Performance
    requests_made = models.PositiveIntegerField(default=0)
    bytes_downloaded = models.BigIntegerField(default=0)
    avg_response_time_ms = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Scraping Metrics"
        verbose_name_plural = "Scraping Metrics"
        unique_together = [["spider_type", "date"]]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.spider_type}: {self.date}"

    @property
    def success_rate(self):
        total = self.success_count + self.failure_count
        if total == 0:
            return 0
        return (self.success_count / total) * 100

    @property
    def validation_rate(self):
        if self.items_scraped == 0:
            return 0
        return (self.items_validated / self.items_scraped) * 100


class SystemHealth(TimeStampedModel):
    """
    System health and performance monitoring.
    """

    timestamp = models.DateTimeField(
        "Timestamp",
        default=timezone.now,
        db_index=True,
    )

    # API Performance
    api_response_time_avg = models.PositiveIntegerField(
        default=0,
        help_text="Average response time in ms",
    )
    api_response_time_p95 = models.PositiveIntegerField(
        default=0,
        help_text="95th percentile response time in ms",
    )
    api_requests_total = models.PositiveIntegerField(default=0)
    api_errors = models.PositiveIntegerField(default=0)

    # Database
    db_query_time_avg = models.PositiveIntegerField(default=0)
    db_connections_active = models.PositiveIntegerField(default=0)
    db_connections_idle = models.PositiveIntegerField(default=0)

    # Cache
    cache_hit_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )
    cache_memory_used_mb = models.PositiveIntegerField(default=0)

    # Celery
    celery_queued_tasks = models.PositiveIntegerField(default=0)
    celery_active_workers = models.PositiveIntegerField(default=0)
    celery_failed_tasks = models.PositiveIntegerField(default=0)

    # System
    cpu_usage_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )
    memory_usage_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )
    disk_usage_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    class Meta:
        verbose_name = "System Health"
        verbose_name_plural = "System Health"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["-timestamp"]),
        ]

    def __str__(self):
        return f"Health: {self.timestamp}"


class TopContent(TimeStampedModel):
    """
    Cached top-performing content for quick dashboard access.
    """

    class Period(models.TextChoices):
        TODAY = "today", "Today"
        WEEK = "week", "This Week"
        MONTH = "month", "This Month"
        ALL_TIME = "all_time", "All Time"

    period = models.CharField(
        "Period",
        max_length=20,
        choices=Period.choices,
    )
    rank = models.PositiveSmallIntegerField(
        "Rank",
    )
    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="top_rankings",
    )
    metric_value = models.BigIntegerField(
        "Metric Value",
        help_text="Views, shares, or engagement score",
    )
    metric_type = models.CharField(
        "Metric Type",
        max_length=20,
        default="views",
    )

    class Meta:
        verbose_name = "Top Content"
        verbose_name_plural = "Top Content"
        unique_together = [["period", "rank", "metric_type"]]
        ordering = ["period", "rank"]

    def __str__(self):
        return f"#{self.rank} {self.period}: {self.article.headline[:30]}"


class GeographicAnalytics(TimeStampedModel):
    """
    Geographic breakdown of traffic.
    """

    date = models.DateField(
        "Date",
        db_index=True,
    )
    country = models.ForeignKey(
        "geography.Country",
        on_delete=models.CASCADE,
        related_name="analytics",
    )

    # Traffic
    page_views = models.BigIntegerField(default=0)
    unique_visitors = models.BigIntegerField(default=0)
    sessions = models.BigIntegerField(default=0)

    # Engagement
    avg_session_duration = models.PositiveIntegerField(
        default=0,
        help_text="Seconds",
    )
    bounce_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    # User metrics
    new_users = models.PositiveIntegerField(default=0)
    returning_users = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Geographic Analytics"
        verbose_name_plural = "Geographic Analytics"
        unique_together = [["date", "country"]]
        ordering = ["-date", "-page_views"]

    def __str__(self):
        return f"{self.country.name}: {self.date}"
