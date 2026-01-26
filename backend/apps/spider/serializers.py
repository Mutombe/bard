"""
Spider Serializers
"""
from rest_framework import serializers

from .models import SpiderJob, DataQualityCheck, SpiderConfig, ScrapedContent


class SpiderJobSerializer(serializers.ModelSerializer):
    """Serializer for spider jobs."""

    success_rate = serializers.SerializerMethodField()

    class Meta:
        model = SpiderJob
        fields = [
            "id",
            "spider_type",
            "status",
            "celery_task_id",
            "started_at",
            "completed_at",
            "duration_seconds",
            "items_scraped",
            "items_saved",
            "items_failed",
            "items_duplicates",
            "requests_made",
            "bytes_downloaded",
            "avg_response_time_ms",
            "error_message",
            "warnings",
            "triggered_by",
            "success_rate",
            "created_at",
        ]

    def get_success_rate(self, obj):
        if obj.items_scraped == 0:
            return 0
        return (obj.items_saved / obj.items_scraped) * 100


class SpiderJobDetailSerializer(SpiderJobSerializer):
    """Detailed serializer including traceback."""

    quality_checks = serializers.SerializerMethodField()

    class Meta(SpiderJobSerializer.Meta):
        fields = SpiderJobSerializer.Meta.fields + [
            "error_traceback",
            "quality_checks",
        ]

    def get_quality_checks(self, obj):
        checks = obj.quality_checks.all()[:10]
        return DataQualityCheckSerializer(checks, many=True).data


class DataQualityCheckSerializer(serializers.ModelSerializer):
    """Serializer for data quality checks."""

    class Meta:
        model = DataQualityCheck
        fields = [
            "id",
            "spider_job",
            "check_type",
            "severity",
            "company_symbol",
            "field_name",
            "expected_value",
            "actual_value",
            "message",
            "details",
            "is_resolved",
            "resolved_at",
            "resolution_note",
            "created_at",
        ]


class SpiderConfigSerializer(serializers.ModelSerializer):
    """Serializer for spider configuration."""

    class Meta:
        model = SpiderConfig
        fields = [
            "id",
            "spider_type",
            "is_enabled",
            "schedule_cron",
            "market_hours_only",
            "market_open",
            "market_close",
            "min_interval_seconds",
            "max_retries",
            "retry_delay_seconds",
            "timeout_seconds",
            "concurrent_requests",
            "min_items_expected",
            "max_price_change_percent",
            "max_volume_change_percent",
            "alert_on_failure",
            "alert_on_quality_issue",
            "alert_email",
        ]


class ScrapedContentSerializer(serializers.ModelSerializer):
    """Serializer for scraped content."""

    class Meta:
        model = ScrapedContent
        fields = [
            "id",
            "spider_job",
            "source",
            "source_url",
            "source_published_at",
            "raw_title",
            "raw_content",
            "raw_excerpt",
            "raw_author",
            "raw_image_url",
            "status",
            "quality_score",
            "readability_score",
            "word_count",
            "has_image",
            "detected_topics",
            "detected_companies",
            "sentiment_score",
            "article",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created_at",
        ]


class ScrapedContentListSerializer(serializers.ModelSerializer):
    """Minimal serializer for listing scraped content."""

    class Meta:
        model = ScrapedContent
        fields = [
            "id",
            "source",
            "raw_title",
            "status",
            "quality_score",
            "word_count",
            "created_at",
        ]


class SpiderDashboardSerializer(serializers.Serializer):
    """Serializer for spider monitoring dashboard."""

    # Overall stats
    jobs_today = serializers.IntegerField()
    jobs_success = serializers.IntegerField()
    jobs_failed = serializers.IntegerField()
    items_scraped_today = serializers.IntegerField()

    # Per-spider stats
    spider_stats = serializers.DictField()

    # Active issues
    unresolved_quality_issues = serializers.IntegerField()
    pending_content = serializers.IntegerField()

    # Recent jobs
    recent_jobs = SpiderJobSerializer(many=True)

    # Recent issues
    recent_issues = DataQualityCheckSerializer(many=True)


class TriggerSpiderSerializer(serializers.Serializer):
    """Serializer for triggering a spider manually."""

    spider_type = serializers.ChoiceField(
        choices=SpiderJob.SpiderType.choices
    )
