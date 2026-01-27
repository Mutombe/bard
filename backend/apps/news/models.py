"""
News Models

Enterprise CMS for financial news and research:
- Category: Article categorization
- Tag: Content tagging
- NewsArticle: Main article model
- ArticleView: Analytics for article views
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from ckeditor_uploader.fields import RichTextUploadingField

from apps.core.models import BaseModel, TimeStampedModel


class Category(TimeStampedModel):
    """Article category for organization."""

    name = models.CharField(
        "Category Name",
        max_length=100,
        unique=True,
    )
    slug = models.SlugField(
        "Slug",
        max_length=100,
        unique=True,
        db_index=True,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )
    color = models.CharField(
        "Color",
        max_length=7,
        default="#FF6B00",
        help_text="Hex color code for UI display",
    )
    icon = models.CharField(
        "Icon",
        max_length=50,
        blank=True,
        help_text="Lucide icon name",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subcategories",
    )
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    order = models.PositiveIntegerField(
        "Display Order",
        default=0,
    )

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(TimeStampedModel):
    """Content tag for cross-cutting topics."""

    name = models.CharField(
        "Tag Name",
        max_length=50,
        unique=True,
    )
    slug = models.SlugField(
        "Slug",
        max_length=50,
        unique=True,
        db_index=True,
    )

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class NewsArticle(BaseModel):
    """
    Main news article model.

    Supports:
    - Rich text content with embedded charts
    - Related companies/stocks
    - Premium content gating
    - Editorial workflow (draft/published)
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_REVIEW = "pending", "Pending Review"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    class ContentType(models.TextChoices):
        NEWS = "news", "News"
        ANALYSIS = "analysis", "Analysis"
        RESEARCH = "research", "Research Report"
        OPINION = "opinion", "Opinion"
        MARKET_UPDATE = "market_update", "Market Update"
        EARNINGS = "earnings", "Earnings Report"

    class Source(models.TextChoices):
        EDITORIAL = "editorial", "Editorial"  # Written by in-house editors
        NEWSAPI = "newsapi", "NewsAPI"
        POLYGON = "polygon", "Polygon.io"
        SCRAPED = "scraped", "Web Scraped"
        SYNDICATED = "syndicated", "Syndicated"  # Partner content

    # =========================
    # Core Content
    # =========================
    title = models.CharField(
        "Title",
        max_length=300,
    )
    slug = models.SlugField(
        "Slug",
        max_length=300,
        unique=True,
        db_index=True,
    )
    subtitle = models.CharField(
        "Subtitle",
        max_length=500,
        blank=True,
    )
    excerpt = models.TextField(
        "Excerpt",
        max_length=500,
        help_text="Short summary for listings and SEO",
    )
    content = RichTextUploadingField(
        "Content",
        help_text="Full article content with rich formatting",
    )

    # =========================
    # Media
    # =========================
    featured_image = models.ImageField(
        "Featured Image",
        upload_to="articles/featured/",
        null=True,
        blank=True,
    )
    featured_image_url = models.URLField(
        "Featured Image URL",
        max_length=500,
        blank=True,
        help_text="External URL for featured image (fallback if no uploaded image)",
    )
    featured_image_caption = models.CharField(
        "Image Caption",
        max_length=300,
        blank=True,
    )

    # =========================
    # Classification
    # =========================
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="articles",
    )
    tags = models.ManyToManyField(
        Tag,
        related_name="articles",
        blank=True,
    )
    content_type = models.CharField(
        "Content Type",
        max_length=20,
        choices=ContentType.choices,
        default=ContentType.NEWS,
    )
    source = models.CharField(
        "Source",
        max_length=20,
        choices=Source.choices,
        default=Source.EDITORIAL,
        db_index=True,
        help_text="Where the article originated from",
    )
    external_url = models.URLField(
        "External URL",
        max_length=500,
        blank=True,
        help_text="Original article URL for aggregated content",
    )
    external_source_name = models.CharField(
        "Source Name",
        max_length=100,
        blank=True,
        help_text="Name of external source (e.g., 'Reuters', 'Bloomberg')",
    )
    priority = models.PositiveSmallIntegerField(
        "Priority",
        default=0,
        db_index=True,
        help_text="Higher priority articles appear first (editorial content gets +10)",
    )

    # =========================
    # Related Stocks
    # =========================
    related_companies = models.ManyToManyField(
        "markets.Company",
        related_name="news_articles",
        blank=True,
        help_text="Companies mentioned or relevant to this article",
    )

    # =========================
    # Authors & Editorial
    # =========================
    author = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="articles",
    )
    editor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edited_articles",
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    # =========================
    # Publishing
    # =========================
    published_at = models.DateTimeField(
        "Published At",
        null=True,
        blank=True,
        db_index=True,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
        help_text="Display prominently on homepage",
    )
    is_breaking = models.BooleanField(
        "Breaking News",
        default=False,
        help_text="Mark as breaking news alert",
    )
    is_premium = models.BooleanField(
        "Premium Content",
        default=False,
        help_text="Requires subscription to read full content",
    )

    # =========================
    # Analytics
    # =========================
    view_count = models.PositiveIntegerField(
        "View Count",
        default=0,
    )
    read_time_minutes = models.PositiveIntegerField(
        "Read Time (minutes)",
        default=5,
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
        verbose_name = "News Article"
        verbose_name_plural = "News Articles"
        # Bloomberg-style ordering: breaking > featured > priority > recency
        ordering = ["-is_breaking", "-is_featured", "-priority", "-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["author", "status"]),
            models.Index(fields=["is_featured", "status"]),
            models.Index(fields=["source", "status"]),
            models.Index(fields=["-priority", "-published_at"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        # Auto-set published_at when status changes to published
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        # Auto-set priority based on source (editorial content ranks higher)
        # This ensures in-house content appears above aggregated content
        if self.source == self.Source.EDITORIAL:
            base_priority = 10
        elif self.source == self.Source.SYNDICATED:
            base_priority = 5
        else:
            base_priority = 0

        # Only set if priority hasn't been manually adjusted
        if self.priority == 0 or self.priority in [0, 5, 10]:
            self.priority = base_priority

        # Calculate read time (average 200 words per minute)
        if self.content:
            word_count = len(self.content.split())
            self.read_time_minutes = max(1, word_count // 200)

        super().save(*args, **kwargs)

    def publish(self):
        """Publish the article."""
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at"])

    def increment_view_count(self):
        """Increment the view count atomically."""
        NewsArticle.objects.filter(pk=self.pk).update(
            view_count=models.F("view_count") + 1
        )


class ArticleView(TimeStampedModel):
    """Analytics model for tracking article views."""

    article = models.ForeignKey(
        NewsArticle,
        on_delete=models.CASCADE,
        related_name="views",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="article_views",
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
    referrer = models.URLField(
        "Referrer",
        blank=True,
    )
    time_on_page = models.PositiveIntegerField(
        "Time on Page (seconds)",
        default=0,
    )

    class Meta:
        verbose_name = "Article View"
        verbose_name_plural = "Article Views"
        ordering = ["-created_at"]

    def __str__(self):
        return f"View: {self.article.title[:50]}"
