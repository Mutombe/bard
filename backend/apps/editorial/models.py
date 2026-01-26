"""
Editorial Models

Editorial workflow system with:
- Content buckets/collections for organization
- Article revision history
- Editorial notes and comments
- Content scheduling
- Assignment tracking
"""
from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel, TimeStampedModel


class ContentBucket(BaseModel):
    """
    Content buckets for organizing articles.

    Allows editors to group content by theme, campaign, or purpose.
    e.g., "Q1 Earnings Coverage", "Election 2024", "Market Analysis"
    """

    class BucketType(models.TextChoices):
        CAMPAIGN = "campaign", "Campaign"
        SERIES = "series", "Series"
        THEME = "theme", "Theme"
        EVENT = "event", "Event Coverage"
        SECTION = "section", "Section"
        ARCHIVE = "archive", "Archive"

    class BucketStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        SCHEDULED = "scheduled", "Scheduled"
        ARCHIVED = "archived", "Archived"
        DRAFT = "draft", "Draft"

    name = models.CharField(
        "Bucket Name",
        max_length=200,
    )
    slug = models.SlugField(
        "Slug",
        max_length=200,
        unique=True,
    )
    description = models.TextField(
        "Description",
        blank=True,
    )
    bucket_type = models.CharField(
        "Type",
        max_length=20,
        choices=BucketType.choices,
        default=BucketType.THEME,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=BucketStatus.choices,
        default=BucketStatus.DRAFT,
    )

    # Organization
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    priority = models.PositiveSmallIntegerField(
        "Priority",
        default=0,
        help_text="Higher = more important",
    )

    # Ownership
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_buckets",
    )
    assigned_editors = models.ManyToManyField(
        "users.User",
        related_name="assigned_buckets",
        blank=True,
    )

    # Scheduling
    start_date = models.DateField(
        "Start Date",
        null=True,
        blank=True,
    )
    end_date = models.DateField(
        "End Date",
        null=True,
        blank=True,
    )

    # Visual
    color = models.CharField(
        "Color",
        max_length=7,
        default="#3B82F6",
        help_text="Hex color code",
    )
    icon = models.CharField(
        "Icon",
        max_length=50,
        blank=True,
        help_text="Lucide icon name",
    )
    cover_image = models.ImageField(
        "Cover Image",
        upload_to="buckets/covers/",
        null=True,
        blank=True,
    )

    # Settings
    is_featured = models.BooleanField(
        "Featured",
        default=False,
    )
    is_public = models.BooleanField(
        "Public",
        default=True,
        help_text="Visible to readers",
    )

    class Meta:
        verbose_name = "Content Bucket"
        verbose_name_plural = "Content Buckets"
        ordering = ["-priority", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["bucket_type", "status"]),
        ]

    def __str__(self):
        return self.name

    @property
    def article_count(self):
        return self.articles.count()


class BucketArticle(TimeStampedModel):
    """
    Junction table for bucket-article relationship with ordering.
    """

    bucket = models.ForeignKey(
        ContentBucket,
        on_delete=models.CASCADE,
        related_name="bucket_articles",
    )
    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="article_buckets",
    )
    order = models.PositiveIntegerField(
        "Order",
        default=0,
    )
    added_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
    )
    is_featured = models.BooleanField(
        "Featured in Bucket",
        default=False,
    )
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    class Meta:
        verbose_name = "Bucket Article"
        verbose_name_plural = "Bucket Articles"
        ordering = ["order"]
        unique_together = [["bucket", "article"]]

    def __str__(self):
        return f"{self.article.headline} in {self.bucket.name}"


class ArticleRevision(TimeStampedModel):
    """
    Version history for article content.

    Tracks all changes with full content snapshots.
    """

    class RevisionType(models.TextChoices):
        CREATE = "create", "Created"
        EDIT = "edit", "Edited"
        STATUS_CHANGE = "status", "Status Change"
        PUBLISH = "publish", "Published"
        UNPUBLISH = "unpublish", "Unpublished"
        RESTORE = "restore", "Restored"
        AUTO_SAVE = "autosave", "Auto-saved"

    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    revision_number = models.PositiveIntegerField(
        "Revision Number",
    )
    revision_type = models.CharField(
        "Type",
        max_length=20,
        choices=RevisionType.choices,
        default=RevisionType.EDIT,
    )

    # Content snapshot
    headline = models.CharField(
        "Headline",
        max_length=500,
    )
    subheadline = models.CharField(
        "Subheadline",
        max_length=500,
        blank=True,
    )
    content = models.TextField(
        "Content",
    )
    excerpt = models.TextField(
        "Excerpt",
        blank=True,
    )

    # Metadata snapshot
    status = models.CharField(
        "Status",
        max_length=20,
    )
    metadata_snapshot = models.JSONField(
        "Metadata",
        default=dict,
        help_text="Snapshot of article metadata at revision time",
    )

    # Editor info
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="article_revisions",
    )
    change_summary = models.CharField(
        "Change Summary",
        max_length=500,
        blank=True,
    )

    # Diff tracking
    word_count = models.PositiveIntegerField(
        "Word Count",
        default=0,
    )
    char_count = models.PositiveIntegerField(
        "Character Count",
        default=0,
    )

    class Meta:
        verbose_name = "Article Revision"
        verbose_name_plural = "Article Revisions"
        ordering = ["-revision_number"]
        unique_together = [["article", "revision_number"]]
        indexes = [
            models.Index(fields=["article", "-revision_number"]),
        ]

    def __str__(self):
        return f"{self.article.headline} - Rev {self.revision_number}"

    def save(self, *args, **kwargs):
        if not self.revision_number:
            last_rev = ArticleRevision.objects.filter(
                article=self.article
            ).order_by("-revision_number").first()
            self.revision_number = (last_rev.revision_number + 1) if last_rev else 1

        # Calculate counts
        self.word_count = len(self.content.split())
        self.char_count = len(self.content)
        super().save(*args, **kwargs)


class EditorialNote(TimeStampedModel):
    """
    Comments and notes on articles during editorial process.
    """

    class NoteType(models.TextChoices):
        COMMENT = "comment", "Comment"
        SUGGESTION = "suggestion", "Suggestion"
        ISSUE = "issue", "Issue"
        APPROVAL = "approval", "Approval"
        REJECTION = "rejection", "Rejection"
        QUESTION = "question", "Question"

    class NoteStatus(models.TextChoices):
        OPEN = "open", "Open"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="editorial_notes",
    )
    author = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="editorial_notes_authored",
    )
    note_type = models.CharField(
        "Type",
        max_length=20,
        choices=NoteType.choices,
        default=NoteType.COMMENT,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=NoteStatus.choices,
        default=NoteStatus.OPEN,
    )

    # Content
    content = models.TextField(
        "Note",
    )
    content_reference = models.TextField(
        "Referenced Text",
        blank=True,
        help_text="Quoted text from article being referenced",
    )

    # Position (for inline comments)
    position_start = models.PositiveIntegerField(
        "Start Position",
        null=True,
        blank=True,
    )
    position_end = models.PositiveIntegerField(
        "End Position",
        null=True,
        blank=True,
    )

    # Resolution
    resolved_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes_resolved",
    )
    resolved_at = models.DateTimeField(
        "Resolved At",
        null=True,
        blank=True,
    )
    resolution_note = models.TextField(
        "Resolution Note",
        blank=True,
    )

    # Threading
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )

    class Meta:
        verbose_name = "Editorial Note"
        verbose_name_plural = "Editorial Notes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["article", "status"]),
            models.Index(fields=["author", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.note_type}: {self.content[:50]}"

    def resolve(self, user, note=""):
        self.status = self.NoteStatus.RESOLVED
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.resolution_note = note
        self.save()


class EditorialAssignment(TimeStampedModel):
    """
    Article assignments for editors and writers.
    """

    class AssignmentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        IN_PROGRESS = "in_progress", "In Progress"
        SUBMITTED = "submitted", "Submitted for Review"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class AssignmentType(models.TextChoices):
        WRITE = "write", "Write Article"
        EDIT = "edit", "Edit Article"
        REVIEW = "review", "Review Article"
        PROOFREAD = "proofread", "Proofread"
        FACT_CHECK = "fact_check", "Fact Check"

    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    assignee = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="editorial_assignments",
    )
    assigned_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="assignments_given",
    )
    assignment_type = models.CharField(
        "Type",
        max_length=20,
        choices=AssignmentType.choices,
        default=AssignmentType.WRITE,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PENDING,
    )

    # Details
    instructions = models.TextField(
        "Instructions",
        blank=True,
    )
    deadline = models.DateTimeField(
        "Deadline",
        null=True,
        blank=True,
    )
    priority = models.PositiveSmallIntegerField(
        "Priority",
        default=0,
        help_text="Higher = more urgent",
    )

    # Tracking
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
    submission_notes = models.TextField(
        "Submission Notes",
        blank=True,
    )

    class Meta:
        verbose_name = "Editorial Assignment"
        verbose_name_plural = "Editorial Assignments"
        ordering = ["-priority", "deadline"]
        indexes = [
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["article", "assignment_type"]),
        ]

    def __str__(self):
        return f"{self.assignment_type}: {self.article.headline} -> {self.assignee}"

    def accept(self):
        self.status = self.AssignmentStatus.ACCEPTED
        self.save()

    def start(self):
        self.status = self.AssignmentStatus.IN_PROGRESS
        self.started_at = timezone.now()
        self.save()

    def submit(self, notes=""):
        self.status = self.AssignmentStatus.SUBMITTED
        self.submission_notes = notes
        self.save()

    def complete(self):
        self.status = self.AssignmentStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save()


class ContentCalendar(TimeStampedModel):
    """
    Editorial content calendar for scheduling.
    """

    class SlotType(models.TextChoices):
        ARTICLE = "article", "Article"
        NEWSLETTER = "newsletter", "Newsletter"
        SOCIAL = "social", "Social Media"
        VIDEO = "video", "Video"
        PODCAST = "podcast", "Podcast"

    class SlotStatus(models.TextChoices):
        PLANNED = "planned", "Planned"
        ASSIGNED = "assigned", "Assigned"
        IN_PROGRESS = "in_progress", "In Progress"
        READY = "ready", "Ready"
        PUBLISHED = "published", "Published"
        SKIPPED = "skipped", "Skipped"

    title = models.CharField(
        "Title",
        max_length=300,
    )
    slot_type = models.CharField(
        "Type",
        max_length=20,
        choices=SlotType.choices,
        default=SlotType.ARTICLE,
    )
    status = models.CharField(
        "Status",
        max_length=20,
        choices=SlotStatus.choices,
        default=SlotStatus.PLANNED,
    )

    # Scheduling
    scheduled_date = models.DateField(
        "Scheduled Date",
    )
    scheduled_time = models.TimeField(
        "Scheduled Time",
        null=True,
        blank=True,
    )

    # Linked content
    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_slots",
    )
    bucket = models.ForeignKey(
        ContentBucket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_slots",
    )

    # Assignment
    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_assignments",
    )
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="calendar_slots_created",
    )

    # Details
    description = models.TextField(
        "Description",
        blank=True,
    )
    notes = models.TextField(
        "Notes",
        blank=True,
    )

    # Recurrence
    is_recurring = models.BooleanField(
        "Recurring",
        default=False,
    )
    recurrence_rule = models.CharField(
        "Recurrence Rule",
        max_length=100,
        blank=True,
        help_text="RRULE format",
    )

    class Meta:
        verbose_name = "Content Calendar"
        verbose_name_plural = "Content Calendar"
        ordering = ["scheduled_date", "scheduled_time"]
        indexes = [
            models.Index(fields=["scheduled_date", "status"]),
            models.Index(fields=["assigned_to", "status"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.scheduled_date}"


class EditorActivity(TimeStampedModel):
    """
    Activity log for editorial actions.
    """

    class ActivityType(models.TextChoices):
        ARTICLE_CREATE = "article_create", "Created Article"
        ARTICLE_EDIT = "article_edit", "Edited Article"
        ARTICLE_PUBLISH = "article_publish", "Published Article"
        ARTICLE_UNPUBLISH = "article_unpublish", "Unpublished Article"
        ARTICLE_DELETE = "article_delete", "Deleted Article"
        ASSIGNMENT_CREATE = "assign_create", "Created Assignment"
        ASSIGNMENT_COMPLETE = "assign_complete", "Completed Assignment"
        NOTE_CREATE = "note_create", "Added Note"
        NOTE_RESOLVE = "note_resolve", "Resolved Note"
        BUCKET_CREATE = "bucket_create", "Created Bucket"
        BUCKET_MODIFY = "bucket_modify", "Modified Bucket"
        LOGIN = "login", "Logged In"
        BULK_ACTION = "bulk", "Bulk Action"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="editor_activities",
    )
    activity_type = models.CharField(
        "Type",
        max_length=30,
        choices=ActivityType.choices,
    )

    # Related objects
    article = models.ForeignKey(
        "news.NewsArticle",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )
    target_user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities_targeted",
    )

    # Details
    description = models.TextField(
        "Description",
    )
    metadata = models.JSONField(
        "Metadata",
        default=dict,
    )
    ip_address = models.GenericIPAddressField(
        "IP Address",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Editor Activity"
        verbose_name_plural = "Editor Activities"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["activity_type", "-created_at"]),
            models.Index(fields=["article", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.activity_type}"
