"""
Spider Monitoring Models

Tracking and monitoring for web scraping jobs.
"""
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class SpiderJob(TimeStampedModel):
    """
    Individual spider job execution record.
    """

    class SpiderType(models.TextChoices):
        JSE = "jse", "JSE Spider"
        ZSE = "zse", "ZSE Spider"
        BSE = "bse", "BSE Spider"
        NEWS = "news", "News Spider"
        FOREX = "forex", "Forex Spider"
        INDICES = "indices", "Indices Spider"

    class JobStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
        PARTIAL = "partial", "Partial Success"

    spider_type = models.CharField(
        "Spider",
        max_length=20,
        choices=SpiderType.choices,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PENDING,
    )
    celery_task_id = models.CharField(
        "Celery Task ID",
        max_length=255,
        blank=True,
    )

    # Timing
    started_at = models.DateTimeField(
        "Started At",
        null=True,
        blank=True,
    )
    completed_at = models.DateTimeField(
        "Completed At",
        null=True,
        blank=True,
    )
    duration_seconds = models.PositiveIntegerField(
        "Duration (seconds)",
        null=True,
        blank=True,
    )

    # Results
    items_scraped = models.PositiveIntegerField(
        "Items Scraped",
        default=0,
    )
    items_saved = models.PositiveIntegerField(
        "Items Saved",
        default=0,
    )
    items_failed = models.PositiveIntegerField(
        "Items Failed",
        default=0,
    )
    items_duplicates = models.PositiveIntegerField(
        "Duplicates Skipped",
        default=0,
    )

    # HTTP metrics
    requests_made = models.PositiveIntegerField(
        "Requests Made",
        default=0,
    )
    bytes_downloaded = models.BigIntegerField(
        "Bytes Downloaded",
        default=0,
    )
    avg_response_time_ms = models.PositiveIntegerField(
        "Avg Response Time (ms)",
        default=0,
    )

    # Error tracking
    error_message = models.TextField(
        "Error Message",
        blank=True,
    )
    error_traceback = models.TextField(
        "Error Traceback",
        blank=True,
    )
    warnings = models.JSONField(
        "Warnings",
        default=list,
    )

    # Trigger info
    triggered_by = models.CharField(
        "Triggered By",
        max_length=50,
        default="celery_beat",
        choices=[
            ("celery_beat", "Scheduled"),
            ("manual", "Manual"),
            ("api", "API"),
            ("retry", "Retry"),
        ],
    )

    class Meta:
        verbose_name = "Spider Job"
        verbose_name_plural = "Spider Jobs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["spider_type", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.spider_type} - {self.status} - {self.created_at}"

    def start(self):
        self.status = self.JobStatus.RUNNING
        self.started_at = timezone.now()
        self.save()

    def complete(self, items_scraped, items_saved, items_failed=0):
        self.status = self.JobStatus.SUCCESS if items_failed == 0 else self.JobStatus.PARTIAL
        self.completed_at = timezone.now()
        self.items_scraped = items_scraped
        self.items_saved = items_saved
        self.items_failed = items_failed
        if self.started_at:
            self.duration_seconds = int(
                (self.completed_at - self.started_at).total_seconds()
            )
        self.save()

    def fail(self, error_message, traceback=""):
        self.status = self.JobStatus.FAILED
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.error_traceback = traceback
        if self.started_at:
            self.duration_seconds = int(
                (self.completed_at - self.started_at).total_seconds()
            )
        self.save()


class DataQualityCheck(TimeStampedModel):
    """
    Data quality validation results.
    """

    class CheckType(models.TextChoices):
        PRICE_RANGE = "price_range", "Price Range Check"
        VOLUME_SPIKE = "volume_spike", "Volume Spike"
        MISSING_DATA = "missing_data", "Missing Data"
        STALE_DATA = "stale_data", "Stale Data"
        DUPLICATE = "duplicate", "Duplicate Detection"
        ANOMALY = "anomaly", "Statistical Anomaly"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"
        CRITICAL = "critical", "Critical"

    spider_job = models.ForeignKey(
        SpiderJob,
        on_delete=models.CASCADE,
        related_name="quality_checks",
        null=True,
        blank=True,
    )
    check_type = models.CharField(
        "Check Type",
        max_length=30,
        choices=CheckType.choices,
    )
    severity = models.CharField(
        "Severity",
        max_length=20,
        choices=Severity.choices,
        default=Severity.WARNING,
    )

    # Target
    company_symbol = models.CharField(
        "Symbol",
        max_length=20,
        blank=True,
    )
    field_name = models.CharField(
        "Field",
        max_length=50,
        blank=True,
    )

    # Values
    expected_value = models.CharField(
        "Expected",
        max_length=255,
        blank=True,
    )
    actual_value = models.CharField(
        "Actual",
        max_length=255,
        blank=True,
    )

    # Details
    message = models.TextField(
        "Message",
    )
    details = models.JSONField(
        "Details",
        default=dict,
    )

    # Resolution
    is_resolved = models.BooleanField(
        "Resolved",
        default=False,
    )
    resolved_at = models.DateTimeField(
        "Resolved At",
        null=True,
        blank=True,
    )
    resolved_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_quality_checks",
    )
    resolution_note = models.TextField(
        "Resolution Note",
        blank=True,
    )

    class Meta:
        verbose_name = "Data Quality Check"
        verbose_name_plural = "Data Quality Checks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["check_type", "-created_at"]),
            models.Index(fields=["severity", "is_resolved"]),
            models.Index(fields=["company_symbol"]),
        ]

    def __str__(self):
        return f"{self.check_type}: {self.message[:50]}"

    def resolve(self, user, note=""):
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.resolution_note = note
        self.save()


class SpiderConfig(TimeStampedModel):
    """
    Configuration for spider behavior.
    """

    spider_type = models.CharField(
        "Spider",
        max_length=20,
        choices=SpiderJob.SpiderType.choices,
        unique=True,
    )
    is_enabled = models.BooleanField(
        "Enabled",
        default=True,
    )

    # Scheduling
    schedule_cron = models.CharField(
        "Cron Schedule",
        max_length=100,
        default="*/5 8-17 * * 1-5",
        help_text="Cron expression for scheduling",
    )
    market_hours_only = models.BooleanField(
        "Market Hours Only",
        default=True,
    )
    market_open = models.TimeField(
        "Market Open",
        default="09:00",
    )
    market_close = models.TimeField(
        "Market Close",
        default="17:00",
    )

    # Rate limiting
    min_interval_seconds = models.PositiveIntegerField(
        "Min Interval (seconds)",
        default=300,
        help_text="Minimum seconds between runs",
    )
    max_retries = models.PositiveSmallIntegerField(
        "Max Retries",
        default=3,
    )
    retry_delay_seconds = models.PositiveIntegerField(
        "Retry Delay (seconds)",
        default=60,
    )

    # Request settings
    timeout_seconds = models.PositiveIntegerField(
        "Timeout (seconds)",
        default=30,
    )
    concurrent_requests = models.PositiveSmallIntegerField(
        "Concurrent Requests",
        default=1,
    )

    # Quality thresholds
    min_items_expected = models.PositiveIntegerField(
        "Min Items Expected",
        default=10,
        help_text="Alert if fewer items scraped",
    )
    max_price_change_percent = models.DecimalField(
        "Max Price Change %",
        max_digits=5,
        decimal_places=2,
        default=50,
        help_text="Flag prices changing more than this %",
    )
    max_volume_change_percent = models.DecimalField(
        "Max Volume Change %",
        max_digits=6,
        decimal_places=2,
        default=1000,
        help_text="Flag volume spikes over this %",
    )

    # Alerts
    alert_on_failure = models.BooleanField(
        "Alert on Failure",
        default=True,
    )
    alert_on_quality_issue = models.BooleanField(
        "Alert on Quality Issue",
        default=True,
    )
    alert_email = models.EmailField(
        "Alert Email",
        blank=True,
    )

    class Meta:
        verbose_name = "Spider Config"
        verbose_name_plural = "Spider Configs"

    def __str__(self):
        return f"{self.spider_type} Configuration"


class ScrapedContent(TimeStampedModel):
    """
    Raw scraped content for news articles.

    Stored before processing and quality review.
    """

    class ContentStatus(models.TextChoices):
        PENDING = "pending", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        PUBLISHED = "published", "Published"

    class ContentSource(models.TextChoices):
        REUTERS = "reuters", "Reuters"
        BLOOMBERG = "bloomberg", "Bloomberg"
        LOCAL_NEWS = "local", "Local News"
        PRESS_RELEASE = "press", "Press Release"
        GOVERNMENT = "gov", "Government"
        CENTRAL_BANK = "central_bank", "Central Bank"

    spider_job = models.ForeignKey(
        SpiderJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scraped_content",
    )
    source = models.CharField(
        "Source",
        max_length=20,
        choices=ContentSource.choices,
    )
    source_url = models.URLField(
        "Source URL",
    )
    source_published_at = models.DateTimeField(
        "Source Published At",
        null=True,
        blank=True,
    )

    # Raw content
    raw_title = models.CharField(
        "Raw Title",
        max_length=500,
    )
    raw_content = models.TextField(
        "Raw Content",
    )
    raw_excerpt = models.TextField(
        "Raw Excerpt",
        blank=True,
    )
    raw_author = models.CharField(
        "Raw Author",
        max_length=200,
        blank=True,
    )
    raw_image_url = models.URLField(
        "Raw Image URL",
        blank=True,
    )

    # Status
    status = models.CharField(
        "Status",
        max_length=20,
        choices=ContentStatus.choices,
        default=ContentStatus.PENDING,
    )

    # Quality metrics
    quality_score = models.DecimalField(
        "Quality Score",
        max_digits=4,
        decimal_places=2,
        default=0,
        help_text="0-100 score",
    )
    readability_score = models.DecimalField(
        "Readability Score",
        max_digits=4,
        decimal_places=2,
        default=0,
    )
    word_count = models.PositiveIntegerField(
        "Word Count",
        default=0,
    )
    has_image = models.BooleanField(
        "Has Image",
        default=False,
    )

    # AI analysis
    detected_topics = models.JSONField(
        "Detected Topics",
        default=list,
    )
    detected_companies = models.JSONField(
        "Detected Companies",
        default=list,
    )
    sentiment_score = models.DecimalField(
        "Sentiment",
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="-1 (negative) to 1 (positive)",
    )

    # Linked article (after publishing)
    article = models.OneToOneField(
        "news.NewsArticle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scraped_source",
    )

    # Review
    reviewed_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_content",
    )
    reviewed_at = models.DateTimeField(
        "Reviewed At",
        null=True,
        blank=True,
    )
    rejection_reason = models.TextField(
        "Rejection Reason",
        blank=True,
    )

    class Meta:
        verbose_name = "Scraped Content"
        verbose_name_plural = "Scraped Content"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["source", "-created_at"]),
            models.Index(fields=["quality_score"]),
        ]

    def __str__(self):
        return f"{self.source}: {self.raw_title[:50]}"

    def approve(self, user):
        self.status = self.ContentStatus.APPROVED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.save()

    def reject(self, user, reason=""):
        self.status = self.ContentStatus.REJECTED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.save()
