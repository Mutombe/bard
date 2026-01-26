"""
Editorial Serializers
"""
from rest_framework import serializers

from apps.users.serializers import UserMinimalSerializer
from apps.news.serializers import NewsArticleListSerializer

from .models import (
    ContentBucket,
    BucketArticle,
    ArticleRevision,
    EditorialNote,
    EditorialAssignment,
    ContentCalendar,
    EditorActivity,
)


class ContentBucketMinimalSerializer(serializers.ModelSerializer):
    """Minimal bucket serializer for references."""

    class Meta:
        model = ContentBucket
        fields = ["id", "name", "slug", "color", "icon", "bucket_type"]


class ContentBucketSerializer(serializers.ModelSerializer):
    """Full bucket serializer."""

    created_by = UserMinimalSerializer(read_only=True)
    assigned_editors = UserMinimalSerializer(many=True, read_only=True)
    article_count = serializers.ReadOnlyField()
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = ContentBucket
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "bucket_type",
            "status",
            "parent",
            "priority",
            "created_by",
            "assigned_editors",
            "start_date",
            "end_date",
            "color",
            "icon",
            "cover_image",
            "is_featured",
            "is_public",
            "article_count",
            "children_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "created_by"]

    def get_children_count(self, obj):
        return obj.children.count()


class ContentBucketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating buckets."""

    class Meta:
        model = ContentBucket
        fields = [
            "name",
            "description",
            "bucket_type",
            "status",
            "parent",
            "priority",
            "start_date",
            "end_date",
            "color",
            "icon",
            "cover_image",
            "is_featured",
            "is_public",
        ]

    def create(self, validated_data):
        from django.utils.text import slugify

        validated_data["created_by"] = self.context["request"].user
        validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)


class BucketArticleSerializer(serializers.ModelSerializer):
    """Serializer for bucket-article relationships."""

    article = NewsArticleListSerializer(read_only=True)
    added_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = BucketArticle
        fields = [
            "id",
            "bucket",
            "article",
            "order",
            "added_by",
            "is_featured",
            "notes",
            "created_at",
        ]
        read_only_fields = ["added_by"]


class BucketArticleCreateSerializer(serializers.ModelSerializer):
    """Serializer for adding articles to buckets."""

    class Meta:
        model = BucketArticle
        fields = ["bucket", "article", "order", "is_featured", "notes"]

    def create(self, validated_data):
        validated_data["added_by"] = self.context["request"].user
        return super().create(validated_data)


class ArticleRevisionSerializer(serializers.ModelSerializer):
    """Serializer for article revisions."""

    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ArticleRevision
        fields = [
            "id",
            "article",
            "revision_number",
            "revision_type",
            "headline",
            "subheadline",
            "content",
            "excerpt",
            "status",
            "metadata_snapshot",
            "created_by",
            "change_summary",
            "word_count",
            "char_count",
            "created_at",
        ]
        read_only_fields = [
            "revision_number",
            "created_by",
            "word_count",
            "char_count",
        ]


class ArticleRevisionListSerializer(serializers.ModelSerializer):
    """Minimal revision serializer for lists."""

    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ArticleRevision
        fields = [
            "id",
            "revision_number",
            "revision_type",
            "headline",
            "status",
            "created_by",
            "change_summary",
            "word_count",
            "created_at",
        ]


class EditorialNoteSerializer(serializers.ModelSerializer):
    """Serializer for editorial notes."""

    author = UserMinimalSerializer(read_only=True)
    resolved_by = UserMinimalSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = EditorialNote
        fields = [
            "id",
            "article",
            "author",
            "note_type",
            "status",
            "content",
            "content_reference",
            "position_start",
            "position_end",
            "resolved_by",
            "resolved_at",
            "resolution_note",
            "parent",
            "replies",
            "reply_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "author",
            "resolved_by",
            "resolved_at",
        ]

    def get_replies(self, obj):
        if obj.parent is None:
            replies = obj.replies.all()[:5]
            return EditorialNoteSerializer(replies, many=True).data
        return []

    def get_reply_count(self, obj):
        return obj.replies.count() if obj.parent is None else 0


class EditorialNoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating editorial notes."""

    class Meta:
        model = EditorialNote
        fields = [
            "article",
            "note_type",
            "content",
            "content_reference",
            "position_start",
            "position_end",
            "parent",
        ]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class EditorialAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for editorial assignments."""

    article = NewsArticleListSerializer(read_only=True)
    assignee = UserMinimalSerializer(read_only=True)
    assigned_by = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = EditorialAssignment
        fields = [
            "id",
            "article",
            "assignee",
            "assigned_by",
            "assignment_type",
            "status",
            "instructions",
            "deadline",
            "priority",
            "started_at",
            "completed_at",
            "submission_notes",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "assigned_by",
            "started_at",
            "completed_at",
        ]

    def get_is_overdue(self, obj):
        from django.utils import timezone

        if obj.deadline and obj.status not in ["completed", "cancelled"]:
            return timezone.now() > obj.deadline
        return False


class EditorialAssignmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating assignments."""

    class Meta:
        model = EditorialAssignment
        fields = [
            "article",
            "assignee",
            "assignment_type",
            "instructions",
            "deadline",
            "priority",
        ]

    def create(self, validated_data):
        validated_data["assigned_by"] = self.context["request"].user
        return super().create(validated_data)


class ContentCalendarSerializer(serializers.ModelSerializer):
    """Serializer for content calendar."""

    article = NewsArticleListSerializer(read_only=True)
    bucket = ContentBucketMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    created_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ContentCalendar
        fields = [
            "id",
            "title",
            "slot_type",
            "status",
            "scheduled_date",
            "scheduled_time",
            "article",
            "bucket",
            "assigned_to",
            "created_by",
            "description",
            "notes",
            "is_recurring",
            "recurrence_rule",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by"]


class ContentCalendarCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating calendar slots."""

    class Meta:
        model = ContentCalendar
        fields = [
            "title",
            "slot_type",
            "status",
            "scheduled_date",
            "scheduled_time",
            "article",
            "bucket",
            "assigned_to",
            "description",
            "notes",
            "is_recurring",
            "recurrence_rule",
        ]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class EditorActivitySerializer(serializers.ModelSerializer):
    """Serializer for editor activity log."""

    user = UserMinimalSerializer(read_only=True)
    target_user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = EditorActivity
        fields = [
            "id",
            "user",
            "activity_type",
            "article",
            "target_user",
            "description",
            "metadata",
            "ip_address",
            "created_at",
        ]


class EditorDashboardStatsSerializer(serializers.Serializer):
    """Serializer for editor dashboard statistics."""

    # Article stats
    total_articles = serializers.IntegerField()
    articles_today = serializers.IntegerField()
    articles_this_week = serializers.IntegerField()
    articles_this_month = serializers.IntegerField()

    # Status breakdown
    draft_count = serializers.IntegerField()
    pending_review_count = serializers.IntegerField()
    published_count = serializers.IntegerField()
    scheduled_count = serializers.IntegerField()

    # Assignments
    pending_assignments = serializers.IntegerField()
    overdue_assignments = serializers.IntegerField()

    # Notes
    open_notes = serializers.IntegerField()
    unresolved_issues = serializers.IntegerField()

    # Calendar
    upcoming_scheduled = serializers.IntegerField()


class BulkActionSerializer(serializers.Serializer):
    """Serializer for bulk operations."""

    article_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
    )
    action = serializers.ChoiceField(
        choices=[
            ("publish", "Publish"),
            ("unpublish", "Unpublish"),
            ("delete", "Delete"),
            ("add_to_bucket", "Add to Bucket"),
            ("remove_from_bucket", "Remove from Bucket"),
            ("assign", "Assign"),
        ]
    )
    bucket_id = serializers.IntegerField(required=False)
    assignee_id = serializers.IntegerField(required=False)

    def validate(self, data):
        if data["action"] == "add_to_bucket" and not data.get("bucket_id"):
            raise serializers.ValidationError(
                "bucket_id is required for add_to_bucket action"
            )
        if data["action"] == "assign" and not data.get("assignee_id"):
            raise serializers.ValidationError(
                "assignee_id is required for assign action"
            )
        return data
