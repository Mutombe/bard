"""
Analytics Admin Configuration
"""
from django.contrib import admin

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


@admin.register(ArticleAnalytics)
class ArticleAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "date",
        "hour",
        "page_views",
        "unique_visitors",
        "avg_time_on_page",
        "bounce_rate",
    ]
    list_filter = ["date", "hour"]
    search_fields = ["article__headline"]
    raw_id_fields = ["article"]
    date_hierarchy = "date"
    readonly_fields = ["created_at", "updated_at"]


@admin.register(DailyMetrics)
class DailyMetricsAdmin(admin.ModelAdmin):
    list_display = [
        "date",
        "total_page_views",
        "total_unique_visitors",
        "articles_published",
        "new_users",
        "active_users",
    ]
    date_hierarchy = "date"
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Date", {"fields": ("date",)}),
        ("Traffic", {"fields": ("total_page_views", "total_unique_visitors", "total_sessions")}),
        ("Content", {"fields": ("articles_published", "articles_updated", "articles_scraped")}),
        ("Users", {"fields": ("new_users", "active_users", "new_subscribers", "churned_subscribers")}),
        ("Engagement", {"fields": ("newsletter_sends", "newsletter_opens", "newsletter_clicks", "price_alerts_sent")}),
        ("Technical", {"fields": ("market_data_updates", "api_requests", "avg_response_time_ms", "error_count")}),
    )


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = [
        "activity_type",
        "user",
        "article",
        "device_type",
        "country_code",
        "created_at",
    ]
    list_filter = ["activity_type", "device_type", "created_at"]
    search_fields = ["user__email", "search_query"]
    raw_id_fields = ["user", "article", "company"]
    date_hierarchy = "created_at"
    readonly_fields = ["created_at"]


@admin.register(ContentPerformance)
class ContentPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "total_views",
        "unique_visitors",
        "engagement_score",
        "trend_direction",
        "trend_percentage",
    ]
    list_filter = ["trend_direction"]
    search_fields = ["article__headline"]
    raw_id_fields = ["article"]
    readonly_fields = ["last_calculated"]

    fieldsets = (
        ("Article", {"fields": ("article",)}),
        ("Lifetime Metrics", {"fields": ("total_views", "unique_visitors", "avg_read_time", "completion_rate")}),
        ("Engagement", {"fields": ("total_shares", "total_comments", "engagement_score")}),
        ("SEO", {"fields": ("search_impressions", "search_clicks", "avg_search_position")}),
        ("Trends", {"fields": ("views_7d", "views_30d", "trend_direction", "trend_percentage")}),
        ("Meta", {"fields": ("last_calculated",)}),
    )


@admin.register(ScrapingMetrics)
class ScrapingMetricsAdmin(admin.ModelAdmin):
    list_display = [
        "spider_type",
        "date",
        "run_count",
        "success_count",
        "failure_count",
        "items_scraped",
        "success_rate",
    ]
    list_filter = ["spider_type", "date"]
    date_hierarchy = "date"
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Spider", {"fields": ("spider_type", "date")}),
        ("Runs", {"fields": ("run_count", "success_count", "failure_count", "avg_run_time_seconds")}),
        ("Data Quality", {"fields": ("items_scraped", "items_validated", "items_rejected", "duplicate_count")}),
        ("Errors", {"fields": ("error_details",)}),
        ("Performance", {"fields": ("requests_made", "bytes_downloaded", "avg_response_time_ms")}),
    )

    def success_rate(self, obj):
        return f"{obj.success_rate:.1f}%"
    success_rate.short_description = "Success Rate"


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    list_display = [
        "timestamp",
        "api_response_time_avg",
        "api_errors",
        "cache_hit_rate",
        "celery_queued_tasks",
        "cpu_usage_percent",
        "memory_usage_percent",
    ]
    date_hierarchy = "timestamp"
    readonly_fields = ["timestamp", "created_at"]

    fieldsets = (
        ("Timestamp", {"fields": ("timestamp",)}),
        ("API", {"fields": ("api_response_time_avg", "api_response_time_p95", "api_requests_total", "api_errors")}),
        ("Database", {"fields": ("db_query_time_avg", "db_connections_active", "db_connections_idle")}),
        ("Cache", {"fields": ("cache_hit_rate", "cache_memory_used_mb")}),
        ("Celery", {"fields": ("celery_queued_tasks", "celery_active_workers", "celery_failed_tasks")}),
        ("System", {"fields": ("cpu_usage_percent", "memory_usage_percent", "disk_usage_percent")}),
    )


@admin.register(TopContent)
class TopContentAdmin(admin.ModelAdmin):
    list_display = ["period", "rank", "article", "metric_value", "metric_type"]
    list_filter = ["period", "metric_type"]
    search_fields = ["article__headline"]
    raw_id_fields = ["article"]
    ordering = ["period", "rank"]


@admin.register(GeographicAnalytics)
class GeographicAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        "date",
        "country",
        "page_views",
        "unique_visitors",
        "new_users",
        "bounce_rate",
    ]
    list_filter = ["date", "country"]
    date_hierarchy = "date"
    raw_id_fields = ["country"]
