"""
Editorial Views

Editor dashboard and workflow management endpoints.
"""
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsEditor, IsAdmin
from apps.news.models import NewsArticle

from .models import (
    ContentBucket,
    BucketArticle,
    ArticleRevision,
    EditorialNote,
    EditorialAssignment,
    ContentCalendar,
    EditorActivity,
)
from .serializers import (
    ContentBucketSerializer,
    ContentBucketMinimalSerializer,
    ContentBucketCreateSerializer,
    BucketArticleSerializer,
    BucketArticleCreateSerializer,
    ArticleRevisionSerializer,
    ArticleRevisionListSerializer,
    EditorialNoteSerializer,
    EditorialNoteCreateSerializer,
    EditorialAssignmentSerializer,
    EditorialAssignmentCreateSerializer,
    ContentCalendarSerializer,
    ContentCalendarCreateSerializer,
    EditorActivitySerializer,
    EditorDashboardStatsSerializer,
    BulkActionSerializer,
)


class ContentBucketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Content Buckets.

    Endpoints:
    - GET /buckets/ - List buckets
    - POST /buckets/ - Create bucket
    - GET /buckets/{slug}/ - Get bucket
    - PUT /buckets/{slug}/ - Update bucket
    - DELETE /buckets/{slug}/ - Delete bucket
    - GET /buckets/{slug}/articles/ - Get bucket articles
    - POST /buckets/{slug}/add-article/ - Add article to bucket
    - DELETE /buckets/{slug}/remove-article/ - Remove article from bucket
    """

    queryset = ContentBucket.objects.all()
    permission_classes = [IsAuthenticated, IsEditor]
    lookup_field = "slug"
    filterset_fields = ["bucket_type", "status", "is_featured", "is_public"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "priority", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ContentBucketMinimalSerializer
        if self.action == "create":
            return ContentBucketCreateSerializer
        return ContentBucketSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.annotate(article_count=Count("bucket_articles"))
        return qs

    @action(detail=True, methods=["get"])
    def articles(self, request, slug=None):
        """Get articles in this bucket."""
        bucket = self.get_object()
        bucket_articles = BucketArticle.objects.filter(
            bucket=bucket
        ).select_related("article", "added_by").order_by("order")

        page = self.paginate_queryset(bucket_articles)
        if page is not None:
            serializer = BucketArticleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = BucketArticleSerializer(bucket_articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_article(self, request, slug=None):
        """Add article to bucket."""
        bucket = self.get_object()
        serializer = BucketArticleCreateSerializer(
            data={**request.data, "bucket": bucket.id},
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        self._log_activity(
            request.user,
            EditorActivity.ActivityType.BUCKET_MODIFY,
            f"Added article to bucket: {bucket.name}",
            article_id=request.data.get("article"),
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"])
    def remove_article(self, request, slug=None):
        """Remove article from bucket."""
        bucket = self.get_object()
        article_id = request.data.get("article_id")

        deleted, _ = BucketArticle.objects.filter(
            bucket=bucket,
            article_id=article_id
        ).delete()

        if deleted:
            self._log_activity(
                request.user,
                EditorActivity.ActivityType.BUCKET_MODIFY,
                f"Removed article from bucket: {bucket.name}",
                article_id=article_id,
            )
            return Response({"message": "Article removed from bucket"})
        return Response(
            {"error": "Article not in bucket"},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=True, methods=["post"])
    def reorder(self, request, slug=None):
        """Reorder articles in bucket."""
        bucket = self.get_object()
        order_data = request.data.get("order", [])

        for item in order_data:
            BucketArticle.objects.filter(
                bucket=bucket,
                article_id=item["article_id"]
            ).update(order=item["order"])

        return Response({"message": "Order updated"})

    def _log_activity(self, user, activity_type, description, article_id=None):
        EditorActivity.objects.create(
            user=user,
            activity_type=activity_type,
            description=description,
            article_id=article_id,
        )


class ArticleRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Article Revisions.

    Read-only - revisions are created automatically.
    """

    queryset = ArticleRevision.objects.all()
    serializer_class = ArticleRevisionSerializer
    permission_classes = [IsAuthenticated, IsEditor]

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleRevisionListSerializer
        return ArticleRevisionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)
        return qs.select_related("created_by")

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Restore article to this revision."""
        revision = self.get_object()
        article = revision.article

        # Create new revision for restore
        ArticleRevision.objects.create(
            article=article,
            revision_type=ArticleRevision.RevisionType.RESTORE,
            headline=revision.headline,
            subheadline=revision.subheadline,
            content=revision.content,
            excerpt=revision.excerpt,
            status=article.status,
            metadata_snapshot={},
            created_by=request.user,
            change_summary=f"Restored from revision {revision.revision_number}",
        )

        # Update article
        article.headline = revision.headline
        article.subheadline = revision.subheadline
        article.content = revision.content
        article.excerpt = revision.excerpt
        article.save()

        return Response({"message": f"Article restored to revision {revision.revision_number}"})

    @action(detail=True, methods=["get"])
    def diff(self, request, pk=None):
        """Get diff between this revision and previous."""
        revision = self.get_object()
        previous = ArticleRevision.objects.filter(
            article=revision.article,
            revision_number__lt=revision.revision_number
        ).order_by("-revision_number").first()

        if not previous:
            return Response({"error": "No previous revision"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "current": ArticleRevisionSerializer(revision).data,
            "previous": ArticleRevisionSerializer(previous).data,
        })


class EditorialNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Editorial Notes.
    """

    queryset = EditorialNote.objects.all()
    permission_classes = [IsAuthenticated, IsEditor]
    filterset_fields = ["article", "note_type", "status", "author"]
    ordering_fields = ["created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return EditorialNoteCreateSerializer
        return EditorialNoteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id)
        return qs.select_related("author", "resolved_by").prefetch_related("replies")

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a note."""
        note = self.get_object()
        resolution_note = request.data.get("resolution_note", "")
        note.resolve(request.user, resolution_note)

        self._log_activity(
            request.user,
            EditorActivity.ActivityType.NOTE_RESOLVE,
            f"Resolved note on article",
            article_id=note.article_id,
        )

        return Response(EditorialNoteSerializer(note).data)

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        """Reply to a note."""
        parent_note = self.get_object()
        serializer = EditorialNoteCreateSerializer(
            data={
                **request.data,
                "article": parent_note.article_id,
                "parent": parent_note.id,
            },
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _log_activity(self, user, activity_type, description, article_id=None):
        EditorActivity.objects.create(
            user=user,
            activity_type=activity_type,
            description=description,
            article_id=article_id,
        )


class EditorialAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Editorial Assignments.
    """

    queryset = EditorialAssignment.objects.all()
    permission_classes = [IsAuthenticated, IsEditor]
    filterset_fields = ["assignee", "assigned_by", "assignment_type", "status", "article"]
    ordering_fields = ["deadline", "priority", "created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return EditorialAssignmentCreateSerializer
        return EditorialAssignmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter by current user's assignments by default
        mine_only = self.request.query_params.get("mine")
        if mine_only:
            qs = qs.filter(assignee=self.request.user)
        return qs.select_related("article", "assignee", "assigned_by")

    @action(detail=False, methods=["get"])
    def my_assignments(self, request):
        """Get current user's assignments."""
        assignments = self.get_queryset().filter(
            assignee=request.user,
            status__in=["pending", "accepted", "in_progress"]
        )
        serializer = EditorialAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """Accept an assignment."""
        assignment = self.get_object()
        if assignment.assignee != request.user:
            return Response(
                {"error": "Not your assignment"},
                status=status.HTTP_403_FORBIDDEN
            )
        assignment.accept()
        return Response(EditorialAssignmentSerializer(assignment).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        """Start working on assignment."""
        assignment = self.get_object()
        if assignment.assignee != request.user:
            return Response(
                {"error": "Not your assignment"},
                status=status.HTTP_403_FORBIDDEN
            )
        assignment.start()
        return Response(EditorialAssignmentSerializer(assignment).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Submit assignment for review."""
        assignment = self.get_object()
        if assignment.assignee != request.user:
            return Response(
                {"error": "Not your assignment"},
                status=status.HTTP_403_FORBIDDEN
            )
        notes = request.data.get("notes", "")
        assignment.submit(notes)

        self._log_activity(
            request.user,
            EditorActivity.ActivityType.ASSIGNMENT_COMPLETE,
            f"Submitted assignment: {assignment.assignment_type}",
            article_id=assignment.article_id,
        )

        return Response(EditorialAssignmentSerializer(assignment).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark assignment as complete (by assigner)."""
        assignment = self.get_object()
        assignment.complete()

        self._log_activity(
            request.user,
            EditorActivity.ActivityType.ASSIGNMENT_COMPLETE,
            f"Completed assignment: {assignment.assignment_type}",
            article_id=assignment.article_id,
        )

        return Response(EditorialAssignmentSerializer(assignment).data)

    def _log_activity(self, user, activity_type, description, article_id=None):
        EditorActivity.objects.create(
            user=user,
            activity_type=activity_type,
            description=description,
            article_id=article_id,
        )


class ContentCalendarViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Content Calendar.
    """

    queryset = ContentCalendar.objects.all()
    permission_classes = [IsAuthenticated, IsEditor]
    filterset_fields = ["slot_type", "status", "assigned_to", "bucket"]
    ordering_fields = ["scheduled_date", "scheduled_time"]

    def get_serializer_class(self):
        if self.action == "create":
            return ContentCalendarCreateSerializer
        return ContentCalendarSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Date range filtering
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if start_date:
            qs = qs.filter(scheduled_date__gte=start_date)
        if end_date:
            qs = qs.filter(scheduled_date__lte=end_date)

        return qs.select_related("article", "bucket", "assigned_to", "created_by")

    @action(detail=False, methods=["get"])
    def week(self, request):
        """Get calendar for current week."""
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        slots = self.get_queryset().filter(
            scheduled_date__gte=start_of_week,
            scheduled_date__lte=end_of_week
        )
        serializer = ContentCalendarSerializer(slots, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def month(self, request):
        """Get calendar for current month."""
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        if today.month == 12:
            end_of_month = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_of_month = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        slots = self.get_queryset().filter(
            scheduled_date__gte=start_of_month,
            scheduled_date__lte=end_of_month
        )
        serializer = ContentCalendarSerializer(slots, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Get upcoming scheduled content."""
        today = timezone.now().date()
        slots = self.get_queryset().filter(
            scheduled_date__gte=today,
            status__in=["planned", "assigned", "in_progress", "ready"]
        )[:20]
        serializer = ContentCalendarSerializer(slots, many=True)
        return Response(serializer.data)


class EditorActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Editor Activity Log.

    Read-only - activities are logged automatically.
    """

    queryset = EditorActivity.objects.all()
    serializer_class = EditorActivitySerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["user", "activity_type", "article"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.select_related("user", "target_user", "article")[:500]

    @action(detail=False, methods=["get"])
    def my_activity(self, request):
        """Get current user's activity."""
        activities = self.get_queryset().filter(user=request.user)[:100]
        serializer = EditorActivitySerializer(activities, many=True)
        return Response(serializer.data)


class EditorDashboardView(APIView):
    """
    Editor Dashboard API.

    Provides aggregated stats and quick access data.
    """

    permission_classes = [IsAuthenticated, IsEditor]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Article stats
        user_articles = NewsArticle.objects.filter(author=user)

        # Status breakdown
        status_counts = user_articles.values("status").annotate(count=Count("id"))
        status_map = {item["status"]: item["count"] for item in status_counts}

        # Assignment stats
        assignments = EditorialAssignment.objects.filter(assignee=user)
        pending_assignments = assignments.filter(
            status__in=["pending", "accepted", "in_progress"]
        ).count()
        overdue_assignments = assignments.filter(
            status__in=["pending", "accepted", "in_progress"],
            deadline__lt=timezone.now()
        ).count()

        # Notes stats
        open_notes = EditorialNote.objects.filter(
            article__author=user,
            status="open"
        ).count()
        unresolved_issues = EditorialNote.objects.filter(
            article__author=user,
            status="open",
            note_type="issue"
        ).count()

        # Calendar stats
        upcoming_scheduled = ContentCalendar.objects.filter(
            assigned_to=user,
            scheduled_date__gte=today,
            status__in=["planned", "assigned", "in_progress", "ready"]
        ).count()

        stats = {
            "total_articles": user_articles.count(),
            "articles_today": user_articles.filter(created_at__date=today).count(),
            "articles_this_week": user_articles.filter(created_at__date__gte=week_ago).count(),
            "articles_this_month": user_articles.filter(created_at__date__gte=month_ago).count(),
            "draft_count": status_map.get("draft", 0),
            "pending_review_count": status_map.get("pending_review", 0),
            "published_count": status_map.get("published", 0),
            "scheduled_count": status_map.get("scheduled", 0),
            "pending_assignments": pending_assignments,
            "overdue_assignments": overdue_assignments,
            "open_notes": open_notes,
            "unresolved_issues": unresolved_issues,
            "upcoming_scheduled": upcoming_scheduled,
        }

        serializer = EditorDashboardStatsSerializer(stats)
        return Response(serializer.data)


class BulkActionView(APIView):
    """
    Bulk operations on articles.
    """

    permission_classes = [IsAuthenticated, IsEditor]

    def post(self, request):
        serializer = BulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        article_ids = serializer.validated_data["article_ids"]

        articles = NewsArticle.objects.filter(id__in=article_ids)
        count = articles.count()

        if action == "publish":
            articles.update(status="published", published_at=timezone.now())
            message = f"Published {count} articles"

        elif action == "unpublish":
            articles.update(status="draft", published_at=None)
            message = f"Unpublished {count} articles"

        elif action == "delete":
            articles.delete()
            message = f"Deleted {count} articles"

        elif action == "add_to_bucket":
            bucket_id = serializer.validated_data["bucket_id"]
            for article in articles:
                BucketArticle.objects.get_or_create(
                    bucket_id=bucket_id,
                    article=article,
                    defaults={"added_by": request.user}
                )
            message = f"Added {count} articles to bucket"

        elif action == "remove_from_bucket":
            bucket_id = serializer.validated_data["bucket_id"]
            BucketArticle.objects.filter(
                bucket_id=bucket_id,
                article__in=articles
            ).delete()
            message = f"Removed {count} articles from bucket"

        elif action == "assign":
            assignee_id = serializer.validated_data["assignee_id"]
            for article in articles:
                EditorialAssignment.objects.create(
                    article=article,
                    assignee_id=assignee_id,
                    assigned_by=request.user,
                    assignment_type="edit",
                )
            message = f"Assigned {count} articles"

        # Log activity
        EditorActivity.objects.create(
            user=request.user,
            activity_type=EditorActivity.ActivityType.BULK_ACTION,
            description=message,
            metadata={"action": action, "article_ids": article_ids},
        )

        return Response({"message": message, "affected": count})
