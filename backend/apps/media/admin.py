"""
Media Admin
"""
from django.contrib import admin
from .models import Video, VideoCategory, PodcastShow, PodcastEpisode, YouTubeChannel


@admin.register(VideoCategory)
class VideoCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "created_at"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "platform",
        "channel_title",
        "status",
        "is_featured",
        "view_count",
        "published_at",
    ]
    list_filter = ["platform", "status", "is_featured", "category"]
    search_fields = ["title", "description", "channel_title", "video_id"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = [
        "view_count",
        "like_count",
        "comment_count",
        "created_at",
        "updated_at",
    ]
    date_hierarchy = "published_at"


@admin.register(PodcastShow)
class PodcastShowAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "description"]


@admin.register(PodcastEpisode)
class PodcastEpisodeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "show",
        "season",
        "episode_number",
        "status",
        "is_featured",
        "published_at",
    ]
    list_filter = ["show", "status", "is_featured", "platform"]
    search_fields = ["title", "description"]
    date_hierarchy = "published_at"


@admin.register(YouTubeChannel)
class YouTubeChannelAdmin(admin.ModelAdmin):
    list_display = [
        "channel_name",
        "channel_id",
        "subscriber_count",
        "video_count",
        "auto_sync",
        "last_synced",
    ]
    list_filter = ["auto_sync", "sync_as_video", "sync_as_podcast"]
    search_fields = ["channel_name", "channel_id"]
    readonly_fields = ["subscriber_count", "video_count", "last_synced"]
