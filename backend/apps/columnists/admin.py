"""
Columnist Admin Configuration
"""
from django.contrib import admin

from .models import Columnist, ColumnistStats, ColumnistFollow, Column, ExpertiseArea


@admin.register(ExpertiseArea)
class ExpertiseAreaAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


class ColumnistStatsInline(admin.StackedInline):
    model = ColumnistStats
    can_delete = False
    readonly_fields = [
        "total_articles", "articles_this_month", "total_views",
        "views_this_month", "avg_views_per_article", "total_followers",
        "engagement_score", "last_calculated"
    ]


@admin.register(Columnist)
class ColumnistAdmin(admin.ModelAdmin):
    list_display = [
        "display_name",
        "columnist_type",
        "title",
        "verification_status",
        "is_active",
        "is_featured",
        "article_count",
    ]
    list_filter = ["columnist_type", "verification_status", "is_active", "is_featured"]
    search_fields = ["display_name", "user__email", "title", "short_bio"]
    prepopulated_fields = {"slug": ("display_name",)}
    filter_horizontal = ["expertise"]
    inlines = [ColumnistStatsInline]

    fieldsets = (
        (None, {"fields": ("user", "display_name", "slug")}),
        ("Professional", {"fields": ("columnist_type", "title", "organization")}),
        ("Bio", {"fields": ("short_bio", "full_bio", "credentials", "expertise")}),
        ("Media", {"fields": ("headshot", "headshot_credit", "banner_image")}),
        ("Social", {"fields": ("twitter_handle", "linkedin_url", "website_url", "email_public")}),
        ("Geography", {"fields": ("primary_region", "primary_country")}),
        ("Status", {"fields": ("verification_status", "is_active", "is_featured", "joined_date")}),
        ("Settings", {"fields": ("show_article_count", "allow_follow", "newsletter_enabled")}),
    )


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ["name", "columnist", "frequency", "is_active", "is_premium"]
    list_filter = ["is_active", "is_premium", "columnist"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ColumnistFollow)
class ColumnistFollowAdmin(admin.ModelAdmin):
    list_display = ["user", "columnist", "created_at"]
    list_filter = ["created_at"]
