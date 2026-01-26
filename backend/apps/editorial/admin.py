"""
Editorial Admin Configuration
"""
from django.contrib import admin

from .models import (
    ContentBucket,
    BucketArticle,
    ArticleRevision,
    EditorialNote,
    EditorialAssignment,
    ContentCalendar,
    EditorActivity,
)


class BucketArticleInline(admin.TabularInline):
    model = BucketArticle
    extra = 0
    raw_id_fields = ["article", "added_by"]
    readonly_fields = ["created_at"]


@admin.register(ContentBucket)
class ContentBucketAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "bucket_type",
        "status",
        "priority",
        "article_count",
        "is_featured",
        "is_public",
    ]
    list_filter = ["bucket_type", "status", "is_featured", "is_public"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["assigned_editors"]
    inlines = [BucketArticleInline]
    raw_id_fields = ["parent", "created_by"]

    fieldsets = (
        (None, {"fields": ("name", "slug", "description")}),
        ("Classification", {"fields": ("bucket_type", "status", "parent", "priority")}),
        ("Ownership", {"fields": ("created_by", "assigned_editors")}),
        ("Schedule", {"fields": ("start_date", "end_date")}),
        ("Appearance", {"fields": ("color", "icon", "cover_image")}),
        ("Settings", {"fields": ("is_featured", "is_public")}),
    )

    def article_count(self, obj):
        return obj.bucket_articles.count()
    article_count.short_description = "Articles"


@admin.register(ArticleRevision)
class ArticleRevisionAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "revision_number",
        "revision_type",
        "created_by",
        "word_count",
        "created_at",
    ]
    list_filter = ["revision_type", "created_at"]
    search_fields = ["article__headline", "headline", "change_summary"]
    raw_id_fields = ["article", "created_by"]
    readonly_fields = [
        "revision_number",
        "word_count",
        "char_count",
        "created_at",
    ]

    fieldsets = (
        (None, {"fields": ("article", "revision_number", "revision_type")}),
        ("Content", {"fields": ("headline", "subheadline", "content", "excerpt")}),
        ("Metadata", {"fields": ("status", "metadata_snapshot")}),
        ("Editor", {"fields": ("created_by", "change_summary")}),
        ("Stats", {"fields": ("word_count", "char_count", "created_at")}),
    )


@admin.register(EditorialNote)
class EditorialNoteAdmin(admin.ModelAdmin):
    list_display = [
        "get_content_preview",
        "article",
        "author",
        "note_type",
        "status",
        "created_at",
    ]
    list_filter = ["note_type", "status", "created_at"]
    search_fields = ["content", "article__headline"]
    raw_id_fields = ["article", "author", "resolved_by", "parent"]
    readonly_fields = ["resolved_at"]

    fieldsets = (
        (None, {"fields": ("article", "author", "note_type", "status")}),
        ("Content", {"fields": ("content", "content_reference")}),
        ("Position", {"fields": ("position_start", "position_end")}),
        ("Resolution", {"fields": ("resolved_by", "resolved_at", "resolution_note")}),
        ("Threading", {"fields": ("parent",)}),
    )

    def get_content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    get_content_preview.short_description = "Note"


@admin.register(EditorialAssignment)
class EditorialAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "assignee",
        "assignment_type",
        "status",
        "priority",
        "deadline",
        "is_overdue",
    ]
    list_filter = ["assignment_type", "status", "priority"]
    search_fields = ["article__headline", "assignee__email"]
    raw_id_fields = ["article", "assignee", "assigned_by"]
    readonly_fields = ["started_at", "completed_at"]

    fieldsets = (
        (None, {"fields": ("article", "assignee", "assigned_by")}),
        ("Assignment", {"fields": ("assignment_type", "status", "instructions")}),
        ("Schedule", {"fields": ("deadline", "priority")}),
        ("Tracking", {"fields": ("started_at", "completed_at", "submission_notes")}),
    )

    def is_overdue(self, obj):
        from django.utils import timezone
        if obj.deadline and obj.status not in ["completed", "cancelled"]:
            return timezone.now() > obj.deadline
        return False
    is_overdue.boolean = True
    is_overdue.short_description = "Overdue"


@admin.register(ContentCalendar)
class ContentCalendarAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "slot_type",
        "status",
        "scheduled_date",
        "scheduled_time",
        "assigned_to",
    ]
    list_filter = ["slot_type", "status", "scheduled_date"]
    search_fields = ["title", "description"]
    raw_id_fields = ["article", "bucket", "assigned_to", "created_by"]
    date_hierarchy = "scheduled_date"

    fieldsets = (
        (None, {"fields": ("title", "slot_type", "status")}),
        ("Schedule", {"fields": ("scheduled_date", "scheduled_time")}),
        ("Content", {"fields": ("article", "bucket")}),
        ("Assignment", {"fields": ("assigned_to", "created_by")}),
        ("Details", {"fields": ("description", "notes")}),
        ("Recurrence", {"fields": ("is_recurring", "recurrence_rule")}),
    )


@admin.register(EditorActivity)
class EditorActivityAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "activity_type",
        "description",
        "article",
        "created_at",
    ]
    list_filter = ["activity_type", "created_at"]
    search_fields = ["user__email", "description"]
    raw_id_fields = ["user", "article", "target_user"]
    readonly_fields = ["created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("user", "activity_type")}),
        ("Details", {"fields": ("description", "metadata")}),
        ("Related", {"fields": ("article", "target_user")}),
        ("Technical", {"fields": ("ip_address", "created_at")}),
    )
