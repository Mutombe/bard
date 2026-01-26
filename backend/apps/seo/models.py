"""
SEO Models

SEO management system with:
- Page-level SEO metadata
- Schema.org structured data
- Open Graph and Twitter cards
- Canonical URL management
- Redirect management
"""
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from apps.core.models import TimeStampedModel


class SEOMetadata(TimeStampedModel):
    """
    SEO metadata for any content type.

    Uses GenericForeignKey to attach to articles, columnists, etc.
    """

    # Generic relation
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Basic SEO
    meta_title = models.CharField(
        "Meta Title",
        max_length=70,
        blank=True,
        help_text="Optimal: 50-60 characters",
    )
    meta_description = models.CharField(
        "Meta Description",
        max_length=160,
        blank=True,
        help_text="Optimal: 150-160 characters",
    )
    meta_keywords = models.CharField(
        "Meta Keywords",
        max_length=255,
        blank=True,
        help_text="Comma-separated keywords",
    )

    # Canonical
    canonical_url = models.URLField(
        "Canonical URL",
        blank=True,
        help_text="Leave blank to use default URL",
    )

    # Robots
    no_index = models.BooleanField(
        "No Index",
        default=False,
        help_text="Prevent search engines from indexing",
    )
    no_follow = models.BooleanField(
        "No Follow",
        default=False,
        help_text="Prevent search engines from following links",
    )

    # Open Graph
    og_title = models.CharField(
        "OG Title",
        max_length=95,
        blank=True,
    )
    og_description = models.CharField(
        "OG Description",
        max_length=200,
        blank=True,
    )
    og_image = models.ImageField(
        "OG Image",
        upload_to="seo/og/",
        null=True,
        blank=True,
        help_text="Recommended: 1200x630px",
    )
    og_type = models.CharField(
        "OG Type",
        max_length=50,
        default="article",
        choices=[
            ("article", "Article"),
            ("website", "Website"),
            ("profile", "Profile"),
            ("book", "Book"),
        ],
    )

    # Twitter Card
    twitter_card = models.CharField(
        "Twitter Card Type",
        max_length=50,
        default="summary_large_image",
        choices=[
            ("summary", "Summary"),
            ("summary_large_image", "Summary Large Image"),
            ("app", "App"),
            ("player", "Player"),
        ],
    )
    twitter_title = models.CharField(
        "Twitter Title",
        max_length=70,
        blank=True,
    )
    twitter_description = models.CharField(
        "Twitter Description",
        max_length=200,
        blank=True,
    )
    twitter_image = models.ImageField(
        "Twitter Image",
        upload_to="seo/twitter/",
        null=True,
        blank=True,
    )

    # Priority for sitemap
    sitemap_priority = models.DecimalField(
        "Sitemap Priority",
        max_digits=2,
        decimal_places=1,
        default=0.5,
        help_text="0.0 to 1.0",
    )
    sitemap_changefreq = models.CharField(
        "Change Frequency",
        max_length=20,
        default="weekly",
        choices=[
            ("always", "Always"),
            ("hourly", "Hourly"),
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
            ("yearly", "Yearly"),
            ("never", "Never"),
        ],
    )

    class Meta:
        verbose_name = "SEO Metadata"
        verbose_name_plural = "SEO Metadata"
        unique_together = [["content_type", "object_id"]]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"SEO: {self.content_object}"

    def get_meta_title(self):
        return self.meta_title or getattr(self.content_object, "headline", "") or str(self.content_object)

    def get_og_title(self):
        return self.og_title or self.get_meta_title()

    def get_twitter_title(self):
        return self.twitter_title or self.get_og_title()


class Redirect(TimeStampedModel):
    """
    URL redirect management.
    """

    class RedirectType(models.IntegerChoices):
        PERMANENT = 301, "301 Permanent"
        TEMPORARY = 302, "302 Temporary"
        SEE_OTHER = 303, "303 See Other"
        TEMPORARY_307 = 307, "307 Temporary"
        PERMANENT_308 = 308, "308 Permanent"

    from_path = models.CharField(
        "From Path",
        max_length=500,
        unique=True,
        help_text="Path without domain, e.g., /old-article",
    )
    to_path = models.CharField(
        "To Path",
        max_length=500,
        help_text="Path or full URL",
    )
    redirect_type = models.IntegerField(
        "Redirect Type",
        choices=RedirectType.choices,
        default=RedirectType.PERMANENT,
    )

    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_regex = models.BooleanField(
        "Use Regex",
        default=False,
        help_text="Treat from_path as regex pattern",
    )

    # Tracking
    hit_count = models.PositiveIntegerField(
        "Hit Count",
        default=0,
    )
    last_hit = models.DateTimeField(
        "Last Hit",
        null=True,
        blank=True,
    )

    # Notes
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    class Meta:
        verbose_name = "Redirect"
        verbose_name_plural = "Redirects"
        ordering = ["from_path"]

    def __str__(self):
        return f"{self.from_path} -> {self.to_path}"


class StructuredData(TimeStampedModel):
    """
    Schema.org structured data templates.
    """

    class SchemaType(models.TextChoices):
        ARTICLE = "Article", "Article"
        NEWS_ARTICLE = "NewsArticle", "News Article"
        ANALYSIS_NEWS = "AnalysisNewsArticle", "Analysis News Article"
        PERSON = "Person", "Person"
        ORGANIZATION = "Organization", "Organization"
        WEBSITE = "WebSite", "Website"
        BREADCRUMB = "BreadcrumbList", "Breadcrumb List"
        FAQ = "FAQPage", "FAQ Page"
        PRODUCT = "Product", "Product"
        EVENT = "Event", "Event"

    name = models.CharField(
        "Name",
        max_length=100,
    )
    schema_type = models.CharField(
        "Schema Type",
        max_length=50,
        choices=SchemaType.choices,
    )
    template = models.JSONField(
        "Template",
        help_text="JSON-LD template with placeholders",
    )
    is_default = models.BooleanField(
        "Default Template",
        default=False,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )

    class Meta:
        verbose_name = "Structured Data Template"
        verbose_name_plural = "Structured Data Templates"

    def __str__(self):
        return f"{self.name} ({self.schema_type})"


class RobotsTxt(TimeStampedModel):
    """
    Robots.txt configuration.
    """

    site = models.CharField(
        "Site",
        max_length=100,
        default="default",
        unique=True,
    )
    content = models.TextField(
        "Content",
        default="""User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
""",
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
    )

    class Meta:
        verbose_name = "Robots.txt"
        verbose_name_plural = "Robots.txt"

    def __str__(self):
        return f"Robots.txt ({self.site})"
