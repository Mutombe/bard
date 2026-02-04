"""
Research Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Topic,
    Industry,
    ResearchReport,
    ResearchDownload,
    ResearchRelated,
)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "is_featured", "order", "article_count"]
    list_filter = ["is_active", "is_featured"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["is_active", "is_featured", "order"]
    ordering = ["order", "name"]

    def article_count(self, obj):
        return obj.article_count
    article_count.short_description = "Articles"


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "is_featured", "order"]
    list_filter = ["is_active", "is_featured"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ["is_active", "is_featured", "order"]
    ordering = ["order", "name"]


class ResearchRelatedInline(admin.TabularInline):
    model = ResearchRelated
    fk_name = "report"
    extra = 1
    autocomplete_fields = ["related_report"]


@admin.register(ResearchReport)
class ResearchReportAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "report_type",
        "status",
        "lead_author",
        "published_at",
        "view_count",
        "download_count",
        "is_featured",
    ]
    list_filter = ["status", "report_type", "is_featured", "is_premium", "topics", "industries"]
    search_fields = ["title", "abstract", "content"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
    autocomplete_fields = ["lead_author", "topics", "industries", "countries", "related_companies"]
    filter_horizontal = ["contributing_authors"]
    inlines = [ResearchRelatedInline]

    fieldsets = (
        (None, {
            "fields": ("title", "slug", "subtitle", "abstract")
        }),
        ("Content", {
            "fields": ("content", "key_findings", "methodology", "data_sources"),
            "classes": ("collapse",),
        }),
        ("Classification", {
            "fields": ("report_type", "topics", "industries", "countries", "related_companies"),
        }),
        ("Authors", {
            "fields": ("lead_author", "contributing_authors", "external_authors"),
        }),
        ("Media", {
            "fields": ("cover_image", "pdf_file"),
        }),
        ("Publishing", {
            "fields": ("status", "published_at", "is_featured", "is_premium"),
        }),
        ("Analytics", {
            "fields": ("view_count", "download_count", "read_time_minutes", "page_count"),
            "classes": ("collapse",),
        }),
        ("SEO", {
            "fields": ("meta_title", "meta_description"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("lead_author")


@admin.register(ResearchDownload)
class ResearchDownloadAdmin(admin.ModelAdmin):
    list_display = ["report", "user", "created_at", "ip_address"]
    list_filter = ["created_at"]
    search_fields = ["report__title", "user__email"]
    date_hierarchy = "created_at"
    readonly_fields = ["report", "user", "session_key", "ip_address", "user_agent", "created_at"]
