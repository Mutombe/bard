"""
Columnist Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Columnist, ColumnistStats, ColumnistFollow, Column, ExpertiseArea
from .serializers import (
    ColumnistSerializer,
    ColumnistMinimalSerializer,
    ColumnSerializer,
    ColumnistFollowSerializer,
    ExpertiseAreaSerializer,
)


class ExpertiseAreaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for ExpertiseArea."""

    queryset = ExpertiseArea.objects.all()
    serializer_class = ExpertiseAreaSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"


class ColumnistViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Columnist profiles.

    Endpoints:
    - GET /columnists/ - List columnists
    - GET /columnists/{slug}/ - Get columnist profile
    - GET /columnists/{slug}/articles/ - Get columnist's articles
    - POST /columnists/{slug}/follow/ - Follow columnist
    - DELETE /columnists/{slug}/unfollow/ - Unfollow columnist
    """

    queryset = Columnist.objects.filter(is_active=True).select_related("user", "stats")
    serializer_class = ColumnistSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["columnist_type", "verification_status", "is_featured", "primary_region"]
    search_fields = ["display_name", "title", "short_bio"]
    ordering_fields = ["display_name", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ColumnistMinimalSerializer
        return ColumnistSerializer

    @action(detail=True, methods=["get"])
    def articles(self, request, slug=None):
        """Get articles by this columnist."""
        columnist = self.get_object()
        from apps.news.models import NewsArticle
        from apps.news.serializers import NewsArticleListSerializer

        articles = NewsArticle.objects.filter(
            author=columnist.user,
            status="published"
        ).order_by("-published_at")

        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = NewsArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = NewsArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def follow(self, request, slug=None):
        """Follow a columnist."""
        columnist = self.get_object()

        if not columnist.allow_follow:
            return Response(
                {"error": "This columnist does not accept followers"},
                status=status.HTTP_400_BAD_REQUEST
            )

        follow, created = ColumnistFollow.objects.get_or_create(
            user=request.user,
            columnist=columnist
        )

        if created:
            return Response({"message": f"Now following {columnist.display_name}"})
        return Response({"message": "Already following"})

    @action(detail=True, methods=["delete"], permission_classes=[IsAuthenticated])
    def unfollow(self, request, slug=None):
        """Unfollow a columnist."""
        columnist = self.get_object()

        deleted, _ = ColumnistFollow.objects.filter(
            user=request.user,
            columnist=columnist
        ).delete()

        if deleted:
            return Response({"message": f"Unfollowed {columnist.display_name}"})
        return Response({"message": "Was not following"})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured columnists."""
        columnists = self.get_queryset().filter(is_featured=True)[:10]
        serializer = ColumnistMinimalSerializer(columnists, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def following(self, request):
        """Get columnists the current user follows."""
        follows = ColumnistFollow.objects.filter(
            user=request.user
        ).select_related("columnist")
        serializer = ColumnistFollowSerializer(follows, many=True)
        return Response(serializer.data)


class ColumnViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Column/Series."""

    queryset = Column.objects.filter(is_active=True).select_related("columnist")
    serializer_class = ColumnSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["columnist", "is_premium"]
    search_fields = ["name", "description"]

    @action(detail=True, methods=["get"])
    def articles(self, request, slug=None):
        """Get articles in this column."""
        column = self.get_object()
        from apps.news.models import NewsArticle
        from apps.news.serializers import NewsArticleListSerializer

        # Assumes NewsArticle has a column FK
        articles = NewsArticle.objects.filter(
            column=column,
            status="published"
        ).order_by("-published_at")

        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = NewsArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = NewsArticleListSerializer(articles, many=True)
        return Response(serializer.data)
