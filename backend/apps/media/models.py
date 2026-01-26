"""
Media Models - Videos and Podcasts
"""
from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class VideoCategory(TimeStampedModel):
    """Categories for videos"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Video Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Video(TimeStampedModel):
    """Video content from YouTube or uploaded"""
    PLATFORM_CHOICES = [
        ("youtube", "YouTube"),
        ("vimeo", "Vimeo"),
        ("upload", "Direct Upload"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField(blank=True)

    # Platform info
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default="youtube")
    video_id = models.CharField(max_length=100, help_text="YouTube/Vimeo video ID")
    video_url = models.URLField(blank=True)
    embed_url = models.URLField(blank=True)

    # Thumbnail
    thumbnail_url = models.URLField(blank=True)
    thumbnail = models.ImageField(upload_to="videos/thumbnails/", blank=True, null=True)

    # Metadata
    duration = models.CharField(max_length=20, blank=True, help_text="Duration in ISO 8601 format")
    duration_seconds = models.PositiveIntegerField(default=0)

    # YouTube metadata
    channel_id = models.CharField(max_length=100, blank=True)
    channel_title = models.CharField(max_length=255, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    # Stats
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)

    # Internal
    category = models.ForeignKey(
        VideoCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="videos"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="videos"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="published")
    is_featured = models.BooleanField(default=False)

    # Tags
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
            models.Index(fields=["platform", "video_id"]),
        ]

    def __str__(self):
        return self.title

    def get_embed_url(self):
        if self.platform == "youtube":
            return f"https://www.youtube.com/embed/{self.video_id}"
        elif self.platform == "vimeo":
            return f"https://player.vimeo.com/video/{self.video_id}"
        return self.embed_url


class PodcastShow(TimeStampedModel):
    """Podcast shows/series"""
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="podcasts/covers/", blank=True, null=True)
    cover_url = models.URLField(blank=True)

    # External links
    spotify_url = models.URLField(blank=True)
    apple_podcasts_url = models.URLField(blank=True)
    youtube_playlist_id = models.CharField(max_length=100, blank=True)
    rss_feed = models.URLField(blank=True)

    # YouTube channel info for fetching episodes
    youtube_channel_id = models.CharField(max_length=100, blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class PodcastEpisode(TimeStampedModel):
    """Individual podcast episodes"""
    PLATFORM_CHOICES = [
        ("youtube", "YouTube"),
        ("spotify", "Spotify"),
        ("apple", "Apple Podcasts"),
        ("upload", "Direct Upload"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    show = models.ForeignKey(
        PodcastShow,
        on_delete=models.CASCADE,
        related_name="episodes"
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)

    # Episode numbering
    season = models.PositiveIntegerField(default=1)
    episode_number = models.PositiveIntegerField(default=1)

    # Platform info
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default="youtube")
    video_id = models.CharField(max_length=100, blank=True, help_text="YouTube video ID")
    audio_url = models.URLField(blank=True)

    # Thumbnail
    thumbnail_url = models.URLField(blank=True)

    # Metadata
    duration = models.CharField(max_length=20, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)

    # Stats
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="published")
    is_featured = models.BooleanField(default=False)

    # Guests
    guests = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        unique_together = [["show", "slug"]]
        indexes = [
            models.Index(fields=["show", "status", "-published_at"]),
        ]

    def __str__(self):
        return f"{self.show.name} - {self.title}"


class YouTubeChannel(TimeStampedModel):
    """Track YouTube channels for automatic syncing"""
    channel_id = models.CharField(max_length=100, unique=True)
    channel_name = models.CharField(max_length=255)
    channel_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)
    description = models.TextField(blank=True)

    subscriber_count = models.PositiveIntegerField(default=0)
    video_count = models.PositiveIntegerField(default=0)

    # Sync settings
    auto_sync = models.BooleanField(default=True)
    sync_as_video = models.BooleanField(default=True, help_text="Sync videos to Video model")
    sync_as_podcast = models.BooleanField(default=False, help_text="Sync videos as podcast episodes")
    podcast_show = models.ForeignKey(
        PodcastShow,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="youtube_channels"
    )

    last_synced = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["channel_name"]

    def __str__(self):
        return self.channel_name
