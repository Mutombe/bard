"""
Podcast Models

Podcast content management system with:
- PodcastShow: Podcast series/shows
- PodcastEpisode: Individual episodes
- PodcastHost: Host profiles
- EpisodeListen: Listen analytics
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import BaseModel, TimeStampedModel


class PodcastShow(BaseModel):
    """
    Podcast show/series container.

    Examples: African Markets Today, The Research Briefing
    """

    class ShowStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        HIATUS = "hiatus", "On Hiatus"
        ENDED = "ended", "Ended"

    # =========================
    # Core Info
    # =========================
    name = models.CharField(
        "Show Name",
        max_length=300,
    )
    slug = models.SlugField(
        "Slug",
        max_length=300,
        unique=True,
        db_index=True,
    )
    tagline = models.CharField(
        "Tagline",
        max_length=300,
        blank=True,
    )
    description = models.TextField(
        "Description",
        help_text="Full show description",
    )
    short_description = models.CharField(
        "Short Description",
        max_length=300,
        blank=True,
        help_text="Brief description for listings",
    )

    # =========================
    # Media
    # =========================
    cover_image = models.ImageField(
        "Cover Image",
        upload_to="podcasts/shows/covers/",
        null=True,
        blank=True,
    )
    cover_image_url = models.URLField(
        "Cover Image URL",
        max_length=500,
        blank=True,
        help_text="External URL for cover image (fallback if no uploaded image)",
    )
    banner_image = models.ImageField(
        "Banner Image",
        upload_to="podcasts/shows/banners/",
        null=True,
        blank=True,
    )

    # =========================
    # Hosts
    # =========================
    hosts = models.ManyToManyField(
        "users.User",
        related_name="podcast_shows",
        blank=True,
    )

    # =========================
    # External Links
    # =========================
    spotify_url = models.URLField(
        "Spotify URL",
        blank=True,
    )
    apple_podcasts_url = models.URLField(
        "Apple Podcasts URL",
        blank=True,
    )
    google_podcasts_url = models.URLField(
        "Google Podcasts URL",
        blank=True,
    )
    youtube_url = models.URLField(
        "YouTube URL",
        blank=True,
    )
    rss_feed_url = models.URLField(
        "RSS Feed URL",
        blank=True,
    )

    # =========================
    # Schedule
    # =========================
    frequency = models.CharField(
        "Frequency",
        max_length=50,
        blank=True,
        help_text="e.g., Daily, Weekly, Bi-weekly",
    )
    publish_day = models.CharField(
        "Publish Day",
        max_length=20,
        blank=True,
        help_text="e.g., Monday, Tuesday",
    )

    # =========================
    # Classification
    # =========================
    topics = models.ManyToManyField(
        "research.Topic",
        related_name="podcast_shows",
        blank=True,
    )
    industries = models.ManyToManyField(
        "research.Industry",
        related_name="podcast_shows",
        blank=True,
    )

    # =========================
    # Status
    # =========================
    status = models.CharField(
        "Status",
        max_length=20,
        choices=ShowStatus.choices,
        default=ShowStatus.ACTIVE,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
    )

    # =========================
    # Analytics
    # =========================
    total_listens = models.BigIntegerField(
        "Total Listens",
        default=0,
    )
    subscriber_count = models.PositiveIntegerField(
        "Subscriber Count",
        default=0,
    )

    class Meta:
        verbose_name = "Podcast Show"
        verbose_name_plural = "Podcast Shows"
        ordering = ["-is_featured", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status", "is_featured"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def episode_count(self):
        """Get count of published episodes."""
        return self.episodes.filter(status="published").count()


class PodcastEpisode(BaseModel):
    """
    Individual podcast episode.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    # =========================
    # Core Info
    # =========================
    show = models.ForeignKey(
        PodcastShow,
        on_delete=models.CASCADE,
        related_name="episodes",
    )
    title = models.CharField(
        "Title",
        max_length=500,
    )
    slug = models.SlugField(
        "Slug",
        max_length=500,
        db_index=True,
    )
    episode_number = models.PositiveIntegerField(
        "Episode Number",
        null=True,
        blank=True,
    )
    season_number = models.PositiveIntegerField(
        "Season Number",
        null=True,
        blank=True,
    )
    description = models.TextField(
        "Description",
        help_text="Episode description/show notes",
    )
    summary = models.CharField(
        "Summary",
        max_length=500,
        blank=True,
        help_text="Brief summary for listings",
    )

    # =========================
    # Content
    # =========================
    show_notes = models.TextField(
        "Show Notes",
        blank=True,
        help_text="Detailed show notes with timestamps",
    )
    transcript = models.TextField(
        "Transcript",
        blank=True,
        help_text="Full episode transcript",
    )
    key_topics = models.JSONField(
        "Key Topics",
        default=list,
        blank=True,
        help_text="List of topics discussed with timestamps",
    )

    # =========================
    # Audio/Video
    # =========================
    audio_file = models.FileField(
        "Audio File",
        upload_to="podcasts/episodes/audio/",
        null=True,
        blank=True,
    )
    audio_url = models.URLField(
        "Audio URL",
        blank=True,
        help_text="External audio URL (e.g., from hosting service)",
    )
    video_url = models.URLField(
        "Video URL",
        blank=True,
        help_text="YouTube or video URL",
    )
    duration_seconds = models.PositiveIntegerField(
        "Duration (seconds)",
        default=0,
    )

    # =========================
    # Media
    # =========================
    cover_image = models.ImageField(
        "Episode Cover",
        upload_to="podcasts/episodes/covers/",
        null=True,
        blank=True,
        help_text="Episode-specific cover (falls back to show cover)",
    )
    cover_image_url = models.URLField(
        "Cover Image URL",
        max_length=500,
        blank=True,
        help_text="External URL for cover image (fallback if no uploaded image)",
    )

    # =========================
    # Guests & Hosts
    # =========================
    hosts = models.ManyToManyField(
        "users.User",
        related_name="podcast_episodes_hosted",
        blank=True,
    )
    guests = models.JSONField(
        "Guests",
        default=list,
        blank=True,
        help_text="List of guest objects with name, title, organization, bio",
    )

    # =========================
    # Classification
    # =========================
    topics = models.ManyToManyField(
        "research.Topic",
        related_name="podcast_episodes",
        blank=True,
    )
    industries = models.ManyToManyField(
        "research.Industry",
        related_name="podcast_episodes",
        blank=True,
    )
    related_articles = models.ManyToManyField(
        "news.NewsArticle",
        related_name="related_podcast_episodes",
        blank=True,
    )
    related_research = models.ManyToManyField(
        "research.ResearchReport",
        related_name="related_podcast_episodes",
        blank=True,
    )

    # =========================
    # Publishing
    # =========================
    status = models.CharField(
        "Status",
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    published_at = models.DateTimeField(
        "Published At",
        null=True,
        blank=True,
        db_index=True,
    )
    scheduled_for = models.DateTimeField(
        "Scheduled For",
        null=True,
        blank=True,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
    )
    is_premium = models.BooleanField(
        "Premium Only",
        default=False,
    )

    # =========================
    # External Platforms
    # =========================
    spotify_episode_id = models.CharField(
        "Spotify Episode ID",
        max_length=100,
        blank=True,
    )
    apple_episode_id = models.CharField(
        "Apple Episode ID",
        max_length=100,
        blank=True,
    )

    # =========================
    # Analytics
    # =========================
    listen_count = models.PositiveIntegerField(
        "Listen Count",
        default=0,
    )
    completion_rate = models.DecimalField(
        "Avg Completion Rate",
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Average % of episode listened",
    )

    # =========================
    # SEO
    # =========================
    meta_title = models.CharField(
        "Meta Title",
        max_length=70,
        blank=True,
    )
    meta_description = models.CharField(
        "Meta Description",
        max_length=160,
        blank=True,
    )

    class Meta:
        verbose_name = "Podcast Episode"
        verbose_name_plural = "Podcast Episodes"
        ordering = ["-published_at", "-created_at"]
        unique_together = [["show", "slug"]]
        indexes = [
            models.Index(fields=["show", "status"]),
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["is_featured", "status"]),
        ]

    def __str__(self):
        return f"{self.show.name}: {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        # Auto-set published_at when status changes to published
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def duration_formatted(self):
        """Get duration in HH:MM:SS or MM:SS format."""
        if not self.duration_seconds:
            return "0:00"
        hours, remainder = divmod(self.duration_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        return f"{minutes}:{seconds:02d}"

    def publish(self):
        """Publish the episode."""
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at"])

    def increment_listen_count(self):
        """Increment the listen count atomically."""
        PodcastEpisode.objects.filter(pk=self.pk).update(
            listen_count=models.F("listen_count") + 1
        )
        # Also update show total
        PodcastShow.objects.filter(pk=self.show_id).update(
            total_listens=models.F("total_listens") + 1
        )


class EpisodeListen(TimeStampedModel):
    """
    Track episode listens for analytics.
    """

    episode = models.ForeignKey(
        PodcastEpisode,
        on_delete=models.CASCADE,
        related_name="listens",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="podcast_listens",
    )
    session_key = models.CharField(
        "Session Key",
        max_length=40,
        blank=True,
    )
    ip_address = models.GenericIPAddressField(
        "IP Address",
        null=True,
        blank=True,
    )
    user_agent = models.TextField(
        "User Agent",
        blank=True,
    )

    # Listen data
    listen_duration_seconds = models.PositiveIntegerField(
        "Listen Duration (seconds)",
        default=0,
    )
    completion_percentage = models.DecimalField(
        "Completion %",
        max_digits=5,
        decimal_places=2,
        default=0,
    )
    platform = models.CharField(
        "Platform",
        max_length=50,
        blank=True,
        help_text="e.g., Web, iOS, Android, Spotify",
    )

    class Meta:
        verbose_name = "Episode Listen"
        verbose_name_plural = "Episode Listens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Listen: {self.episode.title[:50]}"


class PodcastSubscription(TimeStampedModel):
    """
    User subscriptions to podcast shows.
    """

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="podcast_subscriptions",
    )
    show = models.ForeignKey(
        PodcastShow,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    notify_new_episodes = models.BooleanField(
        "Notify New Episodes",
        default=True,
    )

    class Meta:
        verbose_name = "Podcast Subscription"
        verbose_name_plural = "Podcast Subscriptions"
        unique_together = [["user", "show"]]

    def __str__(self):
        return f"{self.user.email} -> {self.show.name}"
