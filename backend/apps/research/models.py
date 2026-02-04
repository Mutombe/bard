"""
Research Models

Research institute publication system with:
- ResearchReport: In-depth research publications
- Topic: Content topics/themes taxonomy
- Industry: Industry sector taxonomy
- ResearchAuthor: Authors with expertise tracking
- ResearchDownload: Download analytics
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from ckeditor_uploader.fields import RichTextUploadingField

from apps.core.models import BaseModel, TimeStampedModel


class Topic(TimeStampedModel):
    """
    Content topic taxonomy for cross-cutting themes.

    Examples: Central Banks, Fintech, ESG, Trade Policy
    """

    name = models.CharField(
        "Topic Name",
        max_length=200,
        unique=True,
    )
    slug = models.SlugField(
        "Slug",
        max_length=200,
        unique=True,
        db_index=True,
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
    color = models.CharField(
        "Color",
        max_length=7,
        default="#3B82F6",
        help_text="Hex color code",
    )

    # Hierarchy
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subtopics",
    )

    # Display
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
        help_text="Display prominently on homepage",
    )
    order = models.PositiveIntegerField(
        "Display Order",
        default=0,
    )

    class Meta:
        verbose_name = "Topic"
        verbose_name_plural = "Topics"
        ordering = ["order", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "is_featured"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def article_count(self):
        """Get count of published articles with this topic."""
        return self.articles.filter(status="published").count()


class Industry(TimeStampedModel):
    """
    Industry sector taxonomy.

    Examples: Banking & Finance, Mining, Technology, Agriculture
    """

    name = models.CharField(
        "Industry Name",
        max_length=200,
        unique=True,
    )
    slug = models.SlugField(
        "Slug",
        max_length=200,
        unique=True,
        db_index=True,
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
    color = models.CharField(
        "Color",
        max_length=7,
        default="#FF6B00",
        help_text="Hex color code",
    )

    # Display
    is_active = models.BooleanField(
        "Active",
        default=True,
    )
    is_featured = models.BooleanField(
        "Featured",
        default=False,
    )
    order = models.PositiveIntegerField(
        "Display Order",
        default=0,
    )

    # Cover image for industry page
    cover_image = models.ImageField(
        "Cover Image",
        upload_to="industries/",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Industry"
        verbose_name_plural = "Industries"
        ordering = ["order", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "is_featured"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ResearchReport(BaseModel):
    """
    In-depth research publication.

    Supports:
    - Multiple authors with expertise tracking
    - PDF downloads
    - Key findings and methodology
    - Related content linking
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEW = "review", "In Review"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    class ReportType(models.TextChoices):
        WHITEPAPER = "whitepaper", "Whitepaper"
        ANALYSIS = "analysis", "Market Analysis"
        OUTLOOK = "outlook", "Sector Outlook"
        COUNTRY_REPORT = "country", "Country Report"
        QUARTERLY = "quarterly", "Quarterly Review"
        ANNUAL = "annual", "Annual Report"
        SPECIAL = "special", "Special Report"

    # =========================
    # Core Content
    # =========================
    title = models.CharField(
        "Title",
        max_length=500,
    )
    slug = models.SlugField(
        "Slug",
        max_length=500,
        unique=True,
        db_index=True,
    )
    subtitle = models.CharField(
        "Subtitle",
        max_length=500,
        blank=True,
    )
    abstract = models.TextField(
        "Abstract",
        help_text="Executive summary of the research",
    )
    content = RichTextUploadingField(
        "Full Content",
        help_text="Full research report content",
    )

    # =========================
    # Research Specifics
    # =========================
    key_findings = models.JSONField(
        "Key Findings",
        default=list,
        blank=True,
        help_text="List of key findings/takeaways",
    )
    methodology = models.TextField(
        "Methodology",
        blank=True,
        help_text="Research methodology description",
    )
    data_sources = models.TextField(
        "Data Sources",
        blank=True,
        help_text="Sources of data used in research",
    )

    # =========================
    # Classification
    # =========================
    report_type = models.CharField(
        "Report Type",
        max_length=20,
        choices=ReportType.choices,
        default=ReportType.ANALYSIS,
    )
    topics = models.ManyToManyField(
        Topic,
        related_name="research_reports",
        blank=True,
    )
    industries = models.ManyToManyField(
        Industry,
        related_name="research_reports",
        blank=True,
    )
    countries = models.ManyToManyField(
        "geography.Country",
        related_name="research_reports",
        blank=True,
    )
    related_companies = models.ManyToManyField(
        "markets.Company",
        related_name="research_reports",
        blank=True,
    )

    # =========================
    # Authors
    # =========================
    lead_author = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="lead_research_reports",
    )
    contributing_authors = models.ManyToManyField(
        "users.User",
        related_name="contributed_research_reports",
        blank=True,
    )
    external_authors = models.JSONField(
        "External Authors",
        default=list,
        blank=True,
        help_text="List of external author objects with name, title, organization",
    )

    # =========================
    # Media
    # =========================
    cover_image = models.ImageField(
        "Cover Image",
        upload_to="research/covers/",
        null=True,
        blank=True,
    )
    cover_image_url = models.URLField(
        "Cover Image URL",
        max_length=500,
        blank=True,
        help_text="External URL for cover image (fallback if no uploaded image)",
    )
    pdf_file = models.FileField(
        "PDF File",
        upload_to="research/pdfs/",
        null=True,
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
    is_featured = models.BooleanField(
        "Featured",
        default=False,
    )
    is_premium = models.BooleanField(
        "Premium Content",
        default=True,
        help_text="Requires subscription to download full report",
    )

    # =========================
    # Analytics
    # =========================
    view_count = models.PositiveIntegerField(
        "View Count",
        default=0,
    )
    download_count = models.PositiveIntegerField(
        "Download Count",
        default=0,
    )
    read_time_minutes = models.PositiveIntegerField(
        "Read Time (minutes)",
        default=15,
    )
    page_count = models.PositiveIntegerField(
        "Page Count",
        default=0,
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
        verbose_name = "Research Report"
        verbose_name_plural = "Research Reports"
        ordering = ["-is_featured", "-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["report_type", "status"]),
            models.Index(fields=["is_featured", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        # Auto-set published_at when status changes to published
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        # Calculate read time (average 200 words per minute)
        if self.content:
            word_count = len(self.content.split())
            self.read_time_minutes = max(1, word_count // 200)

        super().save(*args, **kwargs)

    def publish(self):
        """Publish the research report."""
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at"])

    def increment_view_count(self):
        """Increment the view count atomically."""
        ResearchReport.objects.filter(pk=self.pk).update(
            view_count=models.F("view_count") + 1
        )

    def increment_download_count(self):
        """Increment the download count atomically."""
        ResearchReport.objects.filter(pk=self.pk).update(
            download_count=models.F("download_count") + 1
        )


class ResearchDownload(TimeStampedModel):
    """
    Track research report downloads for analytics.
    """

    report = models.ForeignKey(
        ResearchReport,
        on_delete=models.CASCADE,
        related_name="downloads",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="research_downloads",
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

    class Meta:
        verbose_name = "Research Download"
        verbose_name_plural = "Research Downloads"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Download: {self.report.title[:50]}"


class ResearchRelated(TimeStampedModel):
    """
    Related research reports for cross-linking.
    """

    report = models.ForeignKey(
        ResearchReport,
        on_delete=models.CASCADE,
        related_name="related_from",
    )
    related_report = models.ForeignKey(
        ResearchReport,
        on_delete=models.CASCADE,
        related_name="related_to",
    )
    relation_type = models.CharField(
        "Relation Type",
        max_length=50,
        blank=True,
        help_text="e.g., 'follow-up', 'related', 'supersedes'",
    )
    order = models.PositiveIntegerField(
        "Order",
        default=0,
    )

    class Meta:
        verbose_name = "Related Research"
        verbose_name_plural = "Related Research"
        unique_together = [["report", "related_report"]]
        ordering = ["order"]

    def __str__(self):
        return f"{self.report.title} -> {self.related_report.title}"
