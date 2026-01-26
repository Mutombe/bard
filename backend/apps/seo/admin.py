"""
SEO Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import SEOMetadata, Redirect, StructuredData, RobotsTxt


@admin.register(SEOMetadata)
class SEOMetadataAdmin(admin.ModelAdmin):
    list_display = [
        "content_object",
        "meta_title_preview",
        "meta_description_preview",
        "no_index",
        "sitemap_priority",
    ]
    list_filter = ["no_index", "no_follow", "og_type", "twitter_card"]
    search_fields = ["meta_title", "meta_description"]
    readonly_fields = ["content_type", "object_id"]

    fieldsets = (
        ("Content", {"fields": ("content_type", "object_id")}),
        ("Basic SEO", {"fields": (
            "meta_title", "meta_description", "meta_keywords", "canonical_url"
        )}),
        ("Robots", {"fields": ("no_index", "no_follow")}),
        ("Open Graph", {"fields": (
            "og_title", "og_description", "og_image", "og_type"
        )}),
        ("Twitter Card", {"fields": (
            "twitter_card", "twitter_title", "twitter_description", "twitter_image"
        )}),
        ("Sitemap", {"fields": ("sitemap_priority", "sitemap_changefreq")}),
    )

    def meta_title_preview(self, obj):
        title = obj.meta_title or "-"
        length = len(title)
        color = "green" if length <= 60 else "red"
        return format_html(
            '<span style="color: {}">{} ({})</span>',
            color, title[:50] + "..." if len(title) > 50 else title, length
        )
    meta_title_preview.short_description = "Title"

    def meta_description_preview(self, obj):
        desc = obj.meta_description or "-"
        length = len(desc)
        color = "green" if length <= 160 else "red"
        return format_html(
            '<span style="color: {}">{} ({})</span>',
            color, desc[:50] + "..." if len(desc) > 50 else desc, length
        )
    meta_description_preview.short_description = "Description"


@admin.register(Redirect)
class RedirectAdmin(admin.ModelAdmin):
    list_display = [
        "from_path",
        "to_path",
        "redirect_type",
        "is_active",
        "hit_count",
        "last_hit",
    ]
    list_filter = ["redirect_type", "is_active", "is_regex"]
    search_fields = ["from_path", "to_path", "notes"]
    readonly_fields = ["hit_count", "last_hit"]

    fieldsets = (
        (None, {"fields": ("from_path", "to_path", "redirect_type")}),
        ("Options", {"fields": ("is_active", "is_regex")}),
        ("Stats", {"fields": ("hit_count", "last_hit")}),
        ("Notes", {"fields": ("notes",)}),
    )


@admin.register(StructuredData)
class StructuredDataAdmin(admin.ModelAdmin):
    list_display = ["name", "schema_type", "is_default"]
    list_filter = ["schema_type", "is_default"]
    search_fields = ["name", "description"]

    fieldsets = (
        (None, {"fields": ("name", "schema_type", "is_default")}),
        ("Template", {"fields": ("template",)}),
        ("Description", {"fields": ("description",)}),
    )


@admin.register(RobotsTxt)
class RobotsTxtAdmin(admin.ModelAdmin):
    list_display = ["site", "is_active", "updated_at"]
    list_filter = ["is_active"]

    fieldsets = (
        (None, {"fields": ("site", "is_active")}),
        ("Content", {"fields": ("content",)}),
    )
