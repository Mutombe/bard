"""
Podcast Admin Configuration
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    PodcastShow,
    PodcastEpisode,
    EpisodeListen,
    PodcastSubscription,
)


class PodcastEpisodeInline(admin.TabularInline):
    model = PodcastEpisode
    extra = 0
    fields = ["title", "status", "published_at", "listen_count"]
    readonly_fields = ["listen_count"]
    show_change_link = True


@admin.register(PodcastShow)
class PodcastShowAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "status",
        "episode_count",
        "total_listens",
        "is_featured",
    ]
    list_filter = ["status", "is_featured"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["hosts", "topics", "industries"]
    inlines = [PodcastEpisodeInline]

    fieldsets = (
        (None, {
            "fields": ("name", "slug", "tagline", "description", "short_description")
        }),
        ("Media", {
            "fields": ("cover_image", "banner_image"),
        }),
        ("Hosts", {
            "fields": ("hosts",),
        }),
        ("External Links", {
            "fields": (
                "spotify_url",
                "apple_podcasts_url",
                "google_podcasts_url",
                "youtube_url",
                "rss_feed_url",
            ),
            "classes": ("collapse",),
        }),
        ("Schedule", {
            "fields": ("frequency", "publish_day"),
        }),
        ("Classification", {
            "fields": ("topics", "industries"),
        }),
        ("Status", {
            "fields": ("status", "is_featured"),
        }),
        ("Analytics", {
            "fields": ("total_listens", "subscriber_count"),
            "classes": ("collapse",),
        }),
    )

    def episode_count(self, obj):
        return obj.episode_count
    episode_count.short_description = "Episodes"


@admin.register(PodcastEpisode)
class PodcastEpisodeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "show",
        "episode_number",
        "status",
        "published_at",
        "duration_display",
        "listen_count",
        "is_featured",
    ]
    list_filter = ["status", "show", "is_featured", "is_premium"]
    search_fields = ["title", "description", "show_notes"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
    autocomplete_fields = ["show"]
    filter_horizontal = ["hosts", "topics", "industries", "related_articles", "related_research"]

    fieldsets = (
        (None, {
            "fields": ("show", "title", "slug", "episode_number", "season_number")
        }),
        ("Description", {
            "fields": ("description", "summary"),
        }),
        ("Content", {
            "fields": ("show_notes", "transcript", "key_topics"),
            "classes": ("collapse",),
        }),
        ("Audio/Video", {
            "fields": ("audio_file", "audio_url", "video_url", "duration_seconds"),
        }),
        ("Media", {
            "fields": ("cover_image",),
        }),
        ("Guests & Hosts", {
            "fields": ("hosts", "guests"),
        }),
        ("Classification", {
            "fields": ("topics", "industries", "related_articles", "related_research"),
        }),
        ("Publishing", {
            "fields": ("status", "published_at", "scheduled_for", "is_featured", "is_premium"),
        }),
        ("External Platforms", {
            "fields": ("spotify_episode_id", "apple_episode_id"),
            "classes": ("collapse",),
        }),
        ("Analytics", {
            "fields": ("listen_count", "completion_rate"),
            "classes": ("collapse",),
        }),
        ("SEO", {
            "fields": ("meta_title", "meta_description"),
            "classes": ("collapse",),
        }),
    )

    def duration_display(self, obj):
        return obj.duration_formatted
    duration_display.short_description = "Duration"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("show")


@admin.register(EpisodeListen)
class EpisodeListenAdmin(admin.ModelAdmin):
    list_display = ["episode", "user", "platform", "completion_percentage", "created_at"]
    list_filter = ["platform", "created_at"]
    search_fields = ["episode__title", "user__email"]
    date_hierarchy = "created_at"
    readonly_fields = [
        "episode", "user", "session_key", "ip_address", "user_agent",
        "listen_duration_seconds", "completion_percentage", "platform", "created_at"
    ]


@admin.register(PodcastSubscription)
class PodcastSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "show", "notify_new_episodes", "created_at"]
    list_filter = ["show", "notify_new_episodes"]
    search_fields = ["user__email", "show__name"]
