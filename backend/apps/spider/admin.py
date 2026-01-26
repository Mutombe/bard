"""
Spider Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import SpiderJob, DataQualityCheck, SpiderConfig, ScrapedContent


class DataQualityCheckInline(admin.TabularInline):
    model = DataQualityCheck
    extra = 0
    readonly_fields = [
        "check_type", "severity", "company_symbol",
        "message", "is_resolved", "created_at"
    ]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SpiderJob)
class SpiderJobAdmin(admin.ModelAdmin):
    list_display = [
        "spider_type",
        "status_badge",
        "started_at",
        "duration_display",
        "items_display",
        "triggered_by",
    ]
    list_filter = ["spider_type", "status", "triggered_by", "created_at"]
    search_fields = ["celery_task_id"]
    readonly_fields = [
        "celery_task_id", "started_at", "completed_at", "duration_seconds",
        "items_scraped", "items_saved", "items_failed", "items_duplicates",
        "requests_made", "bytes_downloaded", "avg_response_time_ms",
        "error_message", "error_traceback", "warnings", "created_at",
    ]
    inlines = [DataQualityCheckInline]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("spider_type", "status", "triggered_by", "celery_task_id")}),
        ("Timing", {"fields": ("started_at", "completed_at", "duration_seconds")}),
        ("Results", {"fields": (
            "items_scraped", "items_saved", "items_failed", "items_duplicates"
        )}),
        ("HTTP", {"fields": (
            "requests_made", "bytes_downloaded", "avg_response_time_ms"
        )}),
        ("Errors", {"fields": ("error_message", "error_traceback", "warnings")}),
    )

    def status_badge(self, obj):
        colors = {
            "pending": "#6B7280",
            "running": "#3B82F6",
            "success": "#10B981",
            "failed": "#EF4444",
            "partial": "#F59E0B",
            "cancelled": "#6B7280",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = "Status"

    def duration_display(self, obj):
        if obj.duration_seconds:
            if obj.duration_seconds >= 60:
                return f"{obj.duration_seconds // 60}m {obj.duration_seconds % 60}s"
            return f"{obj.duration_seconds}s"
        return "-"
    duration_display.short_description = "Duration"

    def items_display(self, obj):
        if obj.items_scraped:
            return f"{obj.items_saved}/{obj.items_scraped}"
        return "-"
    items_display.short_description = "Saved/Scraped"


@admin.register(DataQualityCheck)
class DataQualityCheckAdmin(admin.ModelAdmin):
    list_display = [
        "check_type",
        "severity_badge",
        "company_symbol",
        "message_short",
        "is_resolved",
        "created_at",
    ]
    list_filter = ["check_type", "severity", "is_resolved", "created_at"]
    search_fields = ["company_symbol", "message"]
    raw_id_fields = ["spider_job", "resolved_by"]
    readonly_fields = ["resolved_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("spider_job", "check_type", "severity")}),
        ("Target", {"fields": ("company_symbol", "field_name")}),
        ("Values", {"fields": ("expected_value", "actual_value")}),
        ("Details", {"fields": ("message", "details")}),
        ("Resolution", {"fields": (
            "is_resolved", "resolved_at", "resolved_by", "resolution_note"
        )}),
    )

    def severity_badge(self, obj):
        colors = {
            "info": "#3B82F6",
            "warning": "#F59E0B",
            "error": "#EF4444",
            "critical": "#7C3AED",
        }
        color = colors.get(obj.severity, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.severity.upper()
        )
    severity_badge.short_description = "Severity"

    def message_short(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
    message_short.short_description = "Message"


@admin.register(SpiderConfig)
class SpiderConfigAdmin(admin.ModelAdmin):
    list_display = [
        "spider_type",
        "is_enabled",
        "schedule_cron",
        "market_hours_only",
        "min_items_expected",
        "alert_on_failure",
    ]
    list_filter = ["is_enabled", "market_hours_only", "alert_on_failure"]

    fieldsets = (
        (None, {"fields": ("spider_type", "is_enabled")}),
        ("Scheduling", {"fields": (
            "schedule_cron", "market_hours_only", "market_open", "market_close"
        )}),
        ("Rate Limiting", {"fields": (
            "min_interval_seconds", "max_retries", "retry_delay_seconds"
        )}),
        ("Request Settings", {"fields": ("timeout_seconds", "concurrent_requests")}),
        ("Quality Thresholds", {"fields": (
            "min_items_expected", "max_price_change_percent", "max_volume_change_percent"
        )}),
        ("Alerts", {"fields": (
            "alert_on_failure", "alert_on_quality_issue", "alert_email"
        )}),
    )


@admin.register(ScrapedContent)
class ScrapedContentAdmin(admin.ModelAdmin):
    list_display = [
        "raw_title_short",
        "source",
        "status_badge",
        "quality_score",
        "word_count",
        "created_at",
    ]
    list_filter = ["source", "status", "created_at"]
    search_fields = ["raw_title", "raw_content"]
    raw_id_fields = ["spider_job", "article", "reviewed_by"]
    readonly_fields = [
        "quality_score", "readability_score", "word_count", "has_image",
        "detected_topics", "detected_companies", "sentiment_score",
        "reviewed_at", "created_at",
    ]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("spider_job", "source", "source_url", "source_published_at")}),
        ("Content", {"fields": (
            "raw_title", "raw_content", "raw_excerpt", "raw_author", "raw_image_url"
        )}),
        ("Status", {"fields": ("status", "article")}),
        ("Quality", {"fields": (
            "quality_score", "readability_score", "word_count", "has_image"
        )}),
        ("AI Analysis", {"fields": (
            "detected_topics", "detected_companies", "sentiment_score"
        )}),
        ("Review", {"fields": (
            "reviewed_by", "reviewed_at", "rejection_reason"
        )}),
    )

    def raw_title_short(self, obj):
        return obj.raw_title[:60] + "..." if len(obj.raw_title) > 60 else obj.raw_title
    raw_title_short.short_description = "Title"

    def status_badge(self, obj):
        colors = {
            "pending": "#F59E0B",
            "approved": "#10B981",
            "rejected": "#EF4444",
            "published": "#3B82F6",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = "Status"

    actions = ["approve_selected", "reject_selected"]

    def approve_selected(self, request, queryset):
        queryset.update(status="approved")
        self.message_user(request, f"Approved {queryset.count()} items")
    approve_selected.short_description = "Approve selected content"

    def reject_selected(self, request, queryset):
        queryset.update(status="rejected")
        self.message_user(request, f"Rejected {queryset.count()} items")
    reject_selected.short_description = "Reject selected content"
