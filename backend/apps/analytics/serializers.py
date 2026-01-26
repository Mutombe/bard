"""
Analytics Serializers
"""
from rest_framework import serializers

from apps.news.serializers import NewsArticleListSerializer

from .models import (
    ArticleAnalytics,
    DailyMetrics,
    UserActivityLog,
    ContentPerformance,
    ScrapingMetrics,
    SystemHealth,
    TopContent,
    GeographicAnalytics,
)


class ArticleAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for article analytics."""

    class Meta:
        model = ArticleAnalytics
        fields = [
            "id",
            "article",
            "date",
            "hour",
            "page_views",
            "unique_visitors",
            "avg_time_on_page",
            "scroll_depth_avg",
            "bounce_rate",
            "social_shares",
            "comments",
            "source_direct",
            "source_search",
            "source_social",
            "source_referral",
            "source_email",
            "device_desktop",
            "device_mobile",
            "device_tablet",
        ]


class ArticleAnalyticsSummarySerializer(serializers.Serializer):
    """Summary analytics for an article."""

    total_views = serializers.IntegerField()
    unique_visitors = serializers.IntegerField()
    avg_time_on_page = serializers.IntegerField()
    avg_scroll_depth = serializers.FloatField()
    avg_bounce_rate = serializers.FloatField()
    total_shares = serializers.IntegerField()
    total_comments = serializers.IntegerField()

    # Traffic sources breakdown
    sources = serializers.DictField()

    # Device breakdown
    devices = serializers.DictField()

    # Time series
    views_by_day = serializers.ListField()


class DailyMetricsSerializer(serializers.ModelSerializer):
    """Serializer for daily metrics."""

    class Meta:
        model = DailyMetrics
        fields = [
            "id",
            "date",
            "total_page_views",
            "total_unique_visitors",
            "total_sessions",
            "articles_published",
            "articles_updated",
            "articles_scraped",
            "new_users",
            "active_users",
            "new_subscribers",
            "churned_subscribers",
            "newsletter_sends",
            "newsletter_opens",
            "newsletter_clicks",
            "price_alerts_sent",
            "market_data_updates",
            "api_requests",
            "avg_response_time_ms",
            "error_count",
        ]


class UserActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for user activity log."""

    class Meta:
        model = UserActivityLog
        fields = [
            "id",
            "user",
            "session_id",
            "activity_type",
            "article",
            "company",
            "url",
            "referrer",
            "search_query",
            "device_type",
            "country_code",
            "metadata",
            "created_at",
        ]


class ContentPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for content performance."""

    article_headline = serializers.CharField(source="article.headline", read_only=True)
    article_slug = serializers.CharField(source="article.slug", read_only=True)

    class Meta:
        model = ContentPerformance
        fields = [
            "id",
            "article",
            "article_headline",
            "article_slug",
            "total_views",
            "unique_visitors",
            "avg_read_time",
            "completion_rate",
            "total_shares",
            "total_comments",
            "engagement_score",
            "search_impressions",
            "search_clicks",
            "avg_search_position",
            "views_7d",
            "views_30d",
            "trend_direction",
            "trend_percentage",
            "last_calculated",
        ]


class ScrapingMetricsSerializer(serializers.ModelSerializer):
    """Serializer for scraping metrics."""

    success_rate = serializers.ReadOnlyField()
    validation_rate = serializers.ReadOnlyField()

    class Meta:
        model = ScrapingMetrics
        fields = [
            "id",
            "spider_type",
            "date",
            "run_count",
            "success_count",
            "failure_count",
            "avg_run_time_seconds",
            "items_scraped",
            "items_validated",
            "items_rejected",
            "duplicate_count",
            "error_details",
            "requests_made",
            "bytes_downloaded",
            "avg_response_time_ms",
            "success_rate",
            "validation_rate",
        ]


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for system health."""

    class Meta:
        model = SystemHealth
        fields = [
            "id",
            "timestamp",
            "api_response_time_avg",
            "api_response_time_p95",
            "api_requests_total",
            "api_errors",
            "db_query_time_avg",
            "db_connections_active",
            "db_connections_idle",
            "cache_hit_rate",
            "cache_memory_used_mb",
            "celery_queued_tasks",
            "celery_active_workers",
            "celery_failed_tasks",
            "cpu_usage_percent",
            "memory_usage_percent",
            "disk_usage_percent",
        ]


class TopContentSerializer(serializers.ModelSerializer):
    """Serializer for top content."""

    article = NewsArticleListSerializer(read_only=True)

    class Meta:
        model = TopContent
        fields = [
            "id",
            "period",
            "rank",
            "article",
            "metric_value",
            "metric_type",
        ]


class GeographicAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for geographic analytics."""

    country_name = serializers.CharField(source="country.name", read_only=True)
    country_code = serializers.CharField(source="country.code", read_only=True)

    class Meta:
        model = GeographicAnalytics
        fields = [
            "id",
            "date",
            "country",
            "country_name",
            "country_code",
            "page_views",
            "unique_visitors",
            "sessions",
            "avg_session_duration",
            "bounce_rate",
            "new_users",
            "returning_users",
        ]


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard overview."""

    # Today's metrics
    today_views = serializers.IntegerField()
    today_visitors = serializers.IntegerField()
    today_articles = serializers.IntegerField()
    today_new_users = serializers.IntegerField()

    # Comparison with yesterday
    views_change = serializers.FloatField()
    visitors_change = serializers.FloatField()
    articles_change = serializers.FloatField()
    users_change = serializers.FloatField()

    # System status
    system_health = serializers.DictField()
    scraping_status = serializers.DictField()

    # Top content
    top_articles_today = serializers.ListField()
    top_articles_week = serializers.ListField()

    # Geographic breakdown
    top_countries = serializers.ListField()

    # Recent activity
    recent_activity = serializers.ListField()


class TrackEventSerializer(serializers.Serializer):
    """Serializer for tracking events."""

    event_type = serializers.ChoiceField(
        choices=UserActivityLog.ActivityType.choices
    )
    article_id = serializers.IntegerField(required=False)
    company_id = serializers.UUIDField(required=False)
    url = serializers.URLField(required=False)
    referrer = serializers.URLField(required=False)
    search_query = serializers.CharField(required=False, max_length=500)
    metadata = serializers.DictField(required=False, default=dict)


class DateRangeSerializer(serializers.Serializer):
    """Serializer for date range queries."""

    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError("start_date must be before end_date")
        return data
