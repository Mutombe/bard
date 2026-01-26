"""
Columnist Models

Professional author/columnist system with:
- Detailed profiles with credentials
- Social media links
- Expertise areas and beats
- Performance analytics
- Column/series management
"""
from django.db import models
from django.utils.text import slugify

from apps.core.models import BaseModel, TimeStampedModel


class ExpertiseArea(TimeStampedModel):
    """Areas of expertise for columnists."""

    name = models.CharField(
        "Expertise Area",
        max_length=100,
        unique=True,
    )
    slug = models.SlugField(
        "Slug",
        max_length=100,
        unique=True,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )
    icon = models.CharField(
        "Icon",
        max_length=50,
        blank=True,
        help_text="Lucide icon name",
    )

    class Meta:
        verbose_name = "Expertise Area"
        verbose_name_plural = "Expertise Areas"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Columnist(BaseModel):
    """
    Professional columnist/author profile.

    Extends User with detailed professional information.
    """

    class ColumnistType(models.TextChoices):
        STAFF = "staff", "Staff Writer"
        COLUMNIST = "columnist", "Columnist"
        ANALYST = "analyst", "Market Analyst"
        CONTRIBUTOR = "contributor", "Guest Contributor"
        EDITOR = "editor", "Editor"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending Verification"
        VERIFIED = "verified", "Verified"
        FEATURED = "featured", "Featured Expert"

    # =========================
    # User Link
    # =========================
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="columnist_profile",
    )

    # =========================
    # Professional Info
    # =========================
    display_name = models.CharField(
        "Display Name",
        max_length=200,
        help_text="Byline name (can differ from legal name)",
    )
    slug = models.SlugField(
        "Slug",
        max_length=200,
        unique=True,
        db_index=True,
    )
    columnist_type = models.CharField(
        "Type",
        max_length=20,
        choices=ColumnistType.choices,
        default=ColumnistType.CONTRIBUTOR,
    )
    title = models.CharField(
        "Professional Title",
        max_length=200,
        blank=True,
        help_text="e.g., Senior Market Analyst, Economics Editor",
    )
    organization = models.CharField(
        "Organization",
        max_length=200,
        blank=True,
        help_text="Current employer or affiliation",
    )

    # =========================
    # Bio & Credentials
    # =========================
    short_bio = models.CharField(
        "Short Bio",
        max_length=300,
        help_text="Brief bio for article bylines (max 300 chars)",
    )
    full_bio = models.TextField(
        "Full Bio",
        blank=True,
        help_text="Detailed biography for profile page",
    )
    credentials = models.TextField(
        "Credentials",
        blank=True,
        help_text="Qualifications, certifications, education",
    )
    expertise = models.ManyToManyField(
        ExpertiseArea,
        related_name="columnists",
        blank=True,
    )

    # =========================
    # Media
    # =========================
    headshot = models.ImageField(
        "Headshot",
        upload_to="columnists/headshots/",
        null=True,
        blank=True,
    )
    headshot_credit = models.CharField(
        "Photo Credit",
        max_length=200,
        blank=True,
    )
    banner_image = models.ImageField(
        "Banner Image",
        upload_to="columnists/banners/",
        null=True,
        blank=True,
        help_text="Profile page banner",
    )

    # =========================
    # Social Links
    # =========================
    twitter_handle = models.CharField(
        "Twitter/X",
        max_length=50,
        blank=True,
    )
    linkedin_url = models.URLField(
        "LinkedIn",
        blank=True,
    )
    website_url = models.URLField(
        "Personal Website",
        blank=True,
    )
    email_public = models.EmailField(
        "Public Email",
        blank=True,
        help_text="Public contact email (different from account email)",
    )

    # =========================
    # Geographic Focus
    # =========================
    primary_region = models.CharField(
        "Primary Region",
        max_length=20,
        blank=True,
        help_text="Primary geographic coverage area",
    )
    primary_country = models.ForeignKey(
        "geography.Country",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="columnists",
    )

    # =========================
    # Status & Verification
    # =========================
    verification_status = models.CharField(
        "Verification",
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
        help_text="Show on columnists page prominently",
    )
    joined_date = models.DateField(
        "Joined Date",
        null=True,
        blank=True,
    )

    # =========================
    # Settings
    # =========================
    show_article_count = models.BooleanField(
        "Show Article Count",
        default=True,
    )
    allow_follow = models.BooleanField(
        "Allow Following",
        default=True,
    )
    newsletter_enabled = models.BooleanField(
        "Newsletter Enabled",
        default=False,
        help_text="Has personal newsletter subscribers can follow",
    )

    class Meta:
        verbose_name = "Columnist"
        verbose_name_plural = "Columnists"
        ordering = ["display_name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["columnist_type", "is_active"]),
            models.Index(fields=["verification_status"]),
        ]

    def __str__(self):
        return self.display_name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.display_name)
        if not self.display_name:
            self.display_name = self.user.full_name
        super().save(*args, **kwargs)

    @property
    def article_count(self):
        """Get total published article count."""
        return self.user.articles.filter(status="published").count()

    @property
    def total_views(self):
        """Get total views across all articles."""
        return self.user.articles.filter(status="published").aggregate(
            total=models.Sum("view_count")
        )["total"] or 0


class ColumnistStats(TimeStampedModel):
    """
    Cached statistics for columnist performance.

    Updated periodically via Celery task.
    """

    columnist = models.OneToOneField(
        Columnist,
        on_delete=models.CASCADE,
        related_name="stats",
    )

    # Article metrics
    total_articles = models.PositiveIntegerField(default=0)
    articles_this_month = models.PositiveIntegerField(default=0)
    articles_this_year = models.PositiveIntegerField(default=0)

    # Engagement metrics
    total_views = models.BigIntegerField(default=0)
    views_this_month = models.BigIntegerField(default=0)
    avg_views_per_article = models.PositiveIntegerField(default=0)

    # Reader engagement
    total_followers = models.PositiveIntegerField(default=0)
    avg_read_time = models.PositiveIntegerField(
        default=0,
        help_text="Average read time in seconds",
    )

    # Calculated metrics
    engagement_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Calculated engagement score (0-100)",
    )

    last_calculated = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Columnist Stats"
        verbose_name_plural = "Columnist Stats"

    def __str__(self):
        return f"Stats: {self.columnist.display_name}"


class ColumnistFollow(TimeStampedModel):
    """
    User follows for columnists.
    """

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="columnist_follows",
    )
    columnist = models.ForeignKey(
        Columnist,
        on_delete=models.CASCADE,
        related_name="followers",
    )

    class Meta:
        verbose_name = "Columnist Follow"
        verbose_name_plural = "Columnist Follows"
        unique_together = [["user", "columnist"]]

    def __str__(self):
        return f"{self.user.email} follows {self.columnist.display_name}"


class Column(BaseModel):
    """
    Named column/series for recurring content.

    e.g., "Monday Market Watch", "African Tech Weekly"
    """

    name = models.CharField(
        "Column Name",
        max_length=200,
    )
    slug = models.SlugField(
        "Slug",
        max_length=200,
        unique=True,
    )
    description = models.TextField(
        "Description",
    )
    columnist = models.ForeignKey(
        Columnist,
        on_delete=models.CASCADE,
        related_name="columns",
    )
    cover_image = models.ImageField(
        "Cover Image",
        upload_to="columns/",
        null=True,
        blank=True,
    )

    # Schedule
    frequency = models.CharField(
        "Frequency",
        max_length=50,
        blank=True,
        help_text="e.g., Weekly, Daily, Monthly",
    )
    publish_day = models.CharField(
        "Publish Day",
        max_length=20,
        blank=True,
        help_text="e.g., Monday, First of Month",
    )

    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_premium = models.BooleanField(
        "Premium Only",
        default=False,
    )

    class Meta:
        verbose_name = "Column"
        verbose_name_plural = "Columns"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} by {self.columnist.display_name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
